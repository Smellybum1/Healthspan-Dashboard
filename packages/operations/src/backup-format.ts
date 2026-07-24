import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { deflateRawSync, inflateRawSync } from 'node:zlib';
import { z } from 'zod';

export const BACKUP_FORMAT_VERSION = 1;
export const BACKUP_MAGIC = Buffer.from('HSBKUP01', 'ascii');
export const SCRYPT_PARAMS_V1 = {
  N: 16384,
  r: 8,
  p: 1,
  keyLen: 32,
  saltLen: 16,
  nonceLen: 12,
} as const;

export const BACKUP_LIMITS = {
  maxFiles: Number(process.env.HEALTHSPAN_BACKUP_MAX_FILES ?? 5_000),
  maxEntryBytes: Number(process.env.HEALTHSPAN_BACKUP_MAX_ENTRY_BYTES ?? 512 * 1024 * 1024),
  maxTotalUncompressedBytes: Number(
    process.env.HEALTHSPAN_BACKUP_MAX_TOTAL_UNCOMPRESSED_BYTES ?? 2 * 1024 * 1024 * 1024,
  ),
  maxCompressedBytes: Number(
    process.env.HEALTHSPAN_BACKUP_MAX_COMPRESSED_BYTES ?? 2 * 1024 * 1024 * 1024,
  ),
  maxCompressionRatio: Number(process.env.HEALTHSPAN_BACKUP_MAX_COMPRESSION_RATIO ?? 100),
} as const;

export type BackupTier = 'recovery_checkpoint' | 'portable_core' | 'portable_full';

export const BackupManifestV1Schema = z.object({
  formatVersion: z.literal(1),
  tier: z.enum(['recovery_checkpoint', 'portable_core', 'portable_full']),
  appVersion: z.string(),
  schemaVersion: z.number().int(),
  createdAt: z.string(),
  platform: z.string(),
  encrypted: z.boolean(),
  files: z.array(
    z.object({
      path: z.string(),
      sha256: z.string(),
      byteLength: z.number().int().nonnegative(),
    }),
  ),
  exclusions: z.array(z.string()),
  notes: z.array(z.string()),
  manifestSha256: z.string().optional(),
});
export type BackupManifestV1 = z.infer<typeof BackupManifestV1Schema>;

export function sha256Hex(bytes: Buffer | string): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export function sha256File(filePath: string): string {
  const hash = createHash('sha256');
  const fd = fs.openSync(filePath, 'r');
  try {
    const buf = Buffer.alloc(1024 * 1024);
    let n = 0;
    while ((n = fs.readSync(fd, buf, 0, buf.length, null)) > 0) {
      hash.update(buf.subarray(0, n));
    }
  } finally {
    fs.closeSync(fd);
  }
  return hash.digest('hex');
}

export function assertSafeRelPath(rel: string) {
  const n = rel.replace(/\\/g, '/');
  if (!n || n.includes('..') || n.startsWith('/') || /^[a-zA-Z]:/.test(n)) {
    throw new Error(`Unsafe path rejected: ${rel}`);
  }
  if (n.includes('\0')) throw new Error(`Unsafe path rejected: ${rel}`);
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c = CRC_TABLE[(c ^ buf[i]!) & 0xff]! ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

export type ArchiveEntry =
  | { path: string; kind: 'buffer'; data: Buffer }
  | { path: string; kind: 'file'; filePath: string; byteLength: number; sha256: string };

function enforceLimits(
  state: {
    files: number;
    uncompressed: number;
    compressed: number;
  },
  nextUncompressed: number,
  nextCompressed: number,
) {
  if (state.files + 1 > BACKUP_LIMITS.maxFiles) throw new Error('file-count-limit');
  if (nextUncompressed > BACKUP_LIMITS.maxEntryBytes) throw new Error('entry-size-limit');
  if (state.uncompressed + nextUncompressed > BACKUP_LIMITS.maxTotalUncompressedBytes) {
    throw new Error('total-size-limit');
  }
  if (state.compressed + nextCompressed > BACKUP_LIMITS.maxCompressedBytes) {
    throw new Error('compressed-size-limit');
  }
  if (
    nextUncompressed > 0 &&
    nextCompressed > 0 &&
    nextUncompressed / nextCompressed > BACKUP_LIMITS.maxCompressionRatio
  ) {
    throw new Error('compression-ratio-limit');
  }
}

/** In-memory ZIP for small test fixtures. */
export function buildZip(files: Record<string, Buffer>): Buffer {
  const entries: ArchiveEntry[] = Object.entries(files).map(([p, data]) => ({
    path: p,
    kind: 'buffer',
    data,
  }));
  const tmp = path.join(os.tmpdir(), `hs-zip-${process.pid}-${Date.now()}.bin`);
  try {
    buildZipToFile(entries, tmp);
    return fs.readFileSync(tmp);
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

/** Bounded ZIP writer to a file (streams large file entries). */
export function buildZipToFile(entries: ArchiveEntry[], outPath: string) {
  const seen = new Set<string>();
  const locals: Array<{ name: string; offset: number; crc: number; comp: number; uncomp: number }> =
    [];
  const tmp = `${outPath}.${process.pid}.partial`;
  const fd = fs.openSync(tmp, 'w');
  let offset = 0;
  const state = { files: 0, uncompressed: 0, compressed: 0 };
  try {
    for (const entry of entries) {
      assertSafeRelPath(entry.path);
      if (seen.has(entry.path)) throw new Error(`duplicate-path:${entry.path}`);
      seen.add(entry.path);

      let data: Buffer;
      let sha: string;
      if (entry.kind === 'buffer') {
        data = entry.data;
        sha = sha256Hex(data);
      } else {
        if (entry.byteLength > BACKUP_LIMITS.maxEntryBytes) throw new Error('entry-size-limit');
        data = fs.readFileSync(entry.filePath);
        if (data.length !== entry.byteLength) throw new Error(`size-mismatch:${entry.path}`);
        sha = sha256Hex(data);
        if (sha !== entry.sha256) throw new Error(`hash-mismatch:${entry.path}`);
      }

      const compressed = deflateRawSync(data);
      enforceLimits(state, data.length, compressed.length);
      const crc = crc32(data);
      const nameBuf = Buffer.from(entry.path, 'utf8');
      const local = Buffer.alloc(30 + nameBuf.length);
      local.writeUInt32LE(0x04034b50, 0);
      local.writeUInt16LE(20, 4);
      local.writeUInt16LE(0, 6);
      local.writeUInt16LE(8, 8);
      local.writeUInt32LE(crc, 14);
      local.writeUInt32LE(compressed.length, 18);
      local.writeUInt32LE(data.length, 22);
      local.writeUInt16LE(nameBuf.length, 26);
      nameBuf.copy(local, 30);
      fs.writeSync(fd, local);
      fs.writeSync(fd, compressed);
      locals.push({
        name: entry.path,
        offset,
        crc,
        comp: compressed.length,
        uncomp: data.length,
      });
      offset += local.length + compressed.length;
      state.files += 1;
      state.uncompressed += data.length;
      state.compressed += compressed.length;
      void sha;
    }

    const centrals: Buffer[] = [];
    for (const L of locals) {
      const nameBuf = Buffer.from(L.name, 'utf8');
      const central = Buffer.alloc(46 + nameBuf.length);
      central.writeUInt32LE(0x02014b50, 0);
      central.writeUInt16LE(20, 4);
      central.writeUInt16LE(20, 6);
      central.writeUInt16LE(0, 8);
      central.writeUInt16LE(8, 10);
      central.writeUInt32LE(L.crc, 16);
      central.writeUInt32LE(L.comp, 20);
      central.writeUInt32LE(L.uncomp, 24);
      central.writeUInt16LE(nameBuf.length, 28);
      central.writeUInt32LE(L.offset, 42);
      nameBuf.copy(central, 46);
      centrals.push(central);
    }
    const centralDir = Buffer.concat(centrals);
    fs.writeSync(fd, centralDir);
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(centrals.length, 8);
    eocd.writeUInt16LE(centrals.length, 10);
    eocd.writeUInt32LE(centralDir.length, 12);
    eocd.writeUInt32LE(offset, 16);
    fs.writeSync(fd, eocd);
    fs.closeSync(fd);
    fs.renameSync(tmp, outPath);
  } catch (err) {
    try {
      fs.closeSync(fd);
    } catch {
      /* */
    }
    fs.rmSync(tmp, { force: true });
    throw err;
  }
}

export function extractZip(
  zip: Buffer,
  opts: { enforceLimits?: boolean } = {},
): Record<string, Buffer> {
  const out: Record<string, Buffer> = {};
  let offset = 0;
  let files = 0;
  let uncompressed = 0;
  let compressed = 0;
  while (offset + 4 <= zip.length) {
    const sig = zip.readUInt32LE(offset);
    if (sig !== 0x04034b50) break;
    const method = zip.readUInt16LE(offset + 8);
    if (method !== 0 && method !== 8) throw new Error('unknown-compression');
    const compSize = zip.readUInt32LE(offset + 18);
    const uncompSize = zip.readUInt32LE(offset + 22);
    const nameLen = zip.readUInt16LE(offset + 26);
    const extraLen = zip.readUInt16LE(offset + 28);
    const name = zip.subarray(offset + 30, offset + 30 + nameLen).toString('utf8');
    assertSafeRelPath(name);
    if (out[name]) throw new Error(`duplicate-path:${name}`);
    const dataStart = offset + 30 + nameLen + extraLen;
    if (dataStart + compSize > zip.length) throw new Error('truncated-entry');
    const compressedBuf = zip.subarray(dataStart, dataStart + compSize);
    const data = method === 0 ? Buffer.from(compressedBuf) : inflateRawSync(compressedBuf);
    if (data.length !== uncompSize) throw new Error(`Zip size mismatch for ${name}`);
    if (opts.enforceLimits !== false) {
      enforceLimits({ files, uncompressed, compressed }, data.length, compressedBuf.length);
    }
    out[name] = data;
    files += 1;
    uncompressed += data.length;
    compressed += compressedBuf.length;
    offset = dataStart + compSize;
  }
  return out;
}

export function deriveBackupKey(passphrase: string, salt: Buffer): Buffer {
  return scryptSync(passphrase, salt, SCRYPT_PARAMS_V1.keyLen, {
    N: SCRYPT_PARAMS_V1.N,
    r: SCRYPT_PARAMS_V1.r,
    p: SCRYPT_PARAMS_V1.p,
  });
}

export function sealBackupArchive(
  innerZip: Buffer,
  opts: { passphrase?: string; allowUnencrypted?: boolean; manifestSha256?: string },
): Buffer {
  if (!opts.passphrase) {
    if (!opts.allowUnencrypted) {
      throw new Error('Portable backups require a passphrase (or explicit --allow-unencrypted)');
    }
    const header = Buffer.alloc(12 + 32);
    BACKUP_MAGIC.copy(header, 0);
    header.writeUInt16LE(BACKUP_FORMAT_VERSION, 8);
    header.writeUInt16LE(0, 10); // unencrypted
    const manifestHash = Buffer.from(opts.manifestSha256 ?? sha256Hex(''), 'hex');
    if (manifestHash.length !== 32) throw new Error('manifest hash required for recovery archive');
    manifestHash.copy(header, 12);
    return Buffer.concat([header, innerZip]);
  }
  const salt = randomBytes(SCRYPT_PARAMS_V1.saltLen);
  const nonce = randomBytes(SCRYPT_PARAMS_V1.nonceLen);
  const key = deriveBackupKey(opts.passphrase, salt);
  const cipher = createCipheriv('aes-256-gcm', key, nonce);
  // Authenticate versioned header metadata as AAD.
  const aad = Buffer.alloc(12);
  BACKUP_MAGIC.copy(aad, 0);
  aad.writeUInt16LE(BACKUP_FORMAT_VERSION, 8);
  aad.writeUInt16LE(1, 10);
  cipher.setAAD(aad);
  const ciphertext = Buffer.concat([cipher.update(innerZip), cipher.final()]);
  const tag = cipher.getAuthTag();
  const header = Buffer.alloc(12 + salt.length + nonce.length);
  BACKUP_MAGIC.copy(header, 0);
  header.writeUInt16LE(BACKUP_FORMAT_VERSION, 8);
  header.writeUInt16LE(1, 10);
  salt.copy(header, 12);
  nonce.copy(header, 12 + salt.length);
  return Buffer.concat([header, ciphertext, tag]);
}

export function openBackupArchive(
  blob: Buffer,
  passphrase?: string,
): {
  zip: Buffer;
  headerManifestSha256?: string;
} {
  if (blob.length < 12 || !blob.subarray(0, 8).equals(BACKUP_MAGIC)) {
    throw new Error('Invalid backup magic');
  }
  const version = blob.readUInt16LE(8);
  if (version !== BACKUP_FORMAT_VERSION) throw new Error(`Unsupported backup version ${version}`);
  const flags = blob.readUInt16LE(10);
  if ((flags & 1) === 0) {
    if (blob.length < 12 + 32) throw new Error('truncated-header');
    const headerManifestSha256 = blob.subarray(12, 44).toString('hex');
    return { zip: blob.subarray(44), headerManifestSha256 };
  }
  if (!passphrase) throw new Error('Passphrase required');
  const salt = blob.subarray(12, 12 + SCRYPT_PARAMS_V1.saltLen);
  const nonce = blob.subarray(
    12 + SCRYPT_PARAMS_V1.saltLen,
    12 + SCRYPT_PARAMS_V1.saltLen + SCRYPT_PARAMS_V1.nonceLen,
  );
  const body = blob.subarray(12 + SCRYPT_PARAMS_V1.saltLen + SCRYPT_PARAMS_V1.nonceLen);
  if (body.length < 16) throw new Error('Truncated ciphertext');
  const tag = body.subarray(body.length - 16);
  const ciphertext = body.subarray(0, body.length - 16);
  const key = deriveBackupKey(passphrase, salt);
  const decipher = createDecipheriv('aes-256-gcm', key, nonce);
  const aad = Buffer.alloc(12);
  BACKUP_MAGIC.copy(aad, 0);
  aad.writeUInt16LE(BACKUP_FORMAT_VERSION, 8);
  aad.writeUInt16LE(1, 10);
  decipher.setAAD(aad);
  decipher.setAuthTag(tag);
  try {
    return { zip: Buffer.concat([decipher.update(ciphertext), decipher.final()]) };
  } catch {
    throw new Error('Decryption failed — wrong passphrase or tampered archive');
  }
}

/** Acquire passphrase without documenting argv as the normal path. */
export function acquirePassphrase(opts: {
  argv?: string[];
  env?: NodeJS.ProcessEnv;
  allowArgvDeprecated?: boolean;
}): string | undefined {
  const env = opts.env ?? process.env;
  if (env.HEALTHSPAN_BACKUP_PASSPHRASE_TEST_ONLY) {
    return env.HEALTHSPAN_BACKUP_PASSPHRASE_TEST_ONLY;
  }
  if (env.HEALTHSPAN_BACKUP_PASSPHRASE_FD) {
    const fd = Number(env.HEALTHSPAN_BACKUP_PASSPHRASE_FD);
    const buf = Buffer.alloc(4096);
    const n = fs.readSync(fd, buf, 0, buf.length, null);
    return buf
      .subarray(0, n)
      .toString('utf8')
      .replace(/\r?\n$/, '');
  }
  const argv = opts.argv ?? process.argv;
  const idx = argv.indexOf('--passphrase');
  if (idx >= 0 && opts.allowArgvDeprecated) {
    console.warn(
      '[DEPRECATED] --passphrase on argv is deprecated; use HEALTHSPAN_BACKUP_PASSPHRASE_TEST_ONLY or FD.',
    );
    return argv[idx + 1];
  }
  return undefined;
}
