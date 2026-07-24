import { createCipheriv, createDecipheriv, randomBytes, scryptSync, createHash } from 'node:crypto';
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
});
export type BackupManifestV1 = z.infer<typeof BackupManifestV1Schema>;

export function sha256Hex(bytes: Buffer | string): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export function assertSafeRelPath(rel: string) {
  const n = rel.replace(/\\/g, '/');
  if (!n || n.includes('..') || n.startsWith('/') || /^[a-zA-Z]:/.test(n)) {
    throw new Error(`Unsafe path rejected: ${rel}`);
  }
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

/** Minimal ZIP builder (deflated). */
export function buildZip(files: Record<string, Buffer>): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const [name, data] of Object.entries(files)) {
    assertSafeRelPath(name);
    const nameBuf = Buffer.from(name, 'utf8');
    const compressed = deflateRawSync(data);
    const crc = crc32(data);
    const local = Buffer.alloc(30 + nameBuf.length + compressed.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    nameBuf.copy(local, 30);
    compressed.copy(local, 30 + nameBuf.length);
    const central = Buffer.alloc(46 + nameBuf.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(offset, 42);
    nameBuf.copy(central, 46);
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }
  const localBlob = Buffer.concat(locals);
  const centralDir = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(centrals.length, 8);
  eocd.writeUInt16LE(centrals.length, 10);
  eocd.writeUInt32LE(centralDir.length, 12);
  eocd.writeUInt32LE(localBlob.length, 16);
  return Buffer.concat([localBlob, centralDir, eocd]);
}

/** Minimal ZIP reader for archives produced by buildZip. */
export function extractZip(zip: Buffer): Record<string, Buffer> {
  const out: Record<string, Buffer> = {};
  let offset = 0;
  while (offset + 4 <= zip.length) {
    const sig = zip.readUInt32LE(offset);
    if (sig !== 0x04034b50) break;
    const method = zip.readUInt16LE(offset + 8);
    const compSize = zip.readUInt32LE(offset + 18);
    const uncompSize = zip.readUInt32LE(offset + 22);
    const nameLen = zip.readUInt16LE(offset + 26);
    const extraLen = zip.readUInt16LE(offset + 28);
    const name = zip.subarray(offset + 30, offset + 30 + nameLen).toString('utf8');
    assertSafeRelPath(name);
    const dataStart = offset + 30 + nameLen + extraLen;
    const compressed = zip.subarray(dataStart, dataStart + compSize);
    const data = method === 0 ? Buffer.from(compressed) : inflateRawSync(compressed);
    if (data.length !== uncompSize) throw new Error(`Zip size mismatch for ${name}`);
    out[name] = data;
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
  opts: { passphrase?: string; allowUnencrypted?: boolean },
): Buffer {
  if (!opts.passphrase) {
    if (!opts.allowUnencrypted) {
      throw new Error('Portable backups require a passphrase (or explicit --allow-unencrypted)');
    }
    const header = Buffer.alloc(12);
    BACKUP_MAGIC.copy(header, 0);
    header.writeUInt16LE(BACKUP_FORMAT_VERSION, 8);
    header.writeUInt16LE(0, 10); // flags: unencrypted
    return Buffer.concat([header, innerZip]);
  }
  const salt = randomBytes(SCRYPT_PARAMS_V1.saltLen);
  const nonce = randomBytes(SCRYPT_PARAMS_V1.nonceLen);
  const key = deriveBackupKey(opts.passphrase, salt);
  const cipher = createCipheriv('aes-256-gcm', key, nonce);
  const ciphertext = Buffer.concat([cipher.update(innerZip), cipher.final()]);
  const tag = cipher.getAuthTag();
  const header = Buffer.alloc(12 + salt.length + nonce.length);
  BACKUP_MAGIC.copy(header, 0);
  header.writeUInt16LE(BACKUP_FORMAT_VERSION, 8);
  header.writeUInt16LE(1, 10); // encrypted
  salt.copy(header, 12);
  nonce.copy(header, 12 + salt.length);
  return Buffer.concat([header, ciphertext, tag]);
}

export function openBackupArchive(blob: Buffer, passphrase?: string): Buffer {
  if (blob.length < 12 || !blob.subarray(0, 8).equals(BACKUP_MAGIC)) {
    throw new Error('Invalid backup magic');
  }
  const version = blob.readUInt16LE(8);
  if (version !== BACKUP_FORMAT_VERSION) throw new Error(`Unsupported backup version ${version}`);
  const flags = blob.readUInt16LE(10);
  if ((flags & 1) === 0) {
    return blob.subarray(12);
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
  decipher.setAuthTag(tag);
  try {
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    throw new Error('Decryption failed — wrong passphrase or tampered archive');
  }
}
