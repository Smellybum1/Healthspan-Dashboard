import { createHash } from 'node:crypto';
import { inflateRawSync } from 'node:zlib';

export type ZipEntry = { path: string; bytes: Buffer };

const MAX_FILES = 200;
const MAX_TOTAL_BYTES = 80 * 1024 * 1024;
const MAX_ENTRY_BYTES = 40 * 1024 * 1024;

/** Reject zip-slip and absolute/drive paths. */
export function assertSafeZipEntryPath(name: string): string {
  const normalized = name.replace(/\\/g, '/');
  if (!normalized || normalized.endsWith('/')) {
    throw new Error(`Rejected directory or empty zip entry: ${name}`);
  }
  if (normalized.startsWith('/') || /^[a-zA-Z]:/.test(normalized)) {
    throw new Error(`Rejected absolute zip entry path: ${name}`);
  }
  const parts = normalized.split('/');
  if (parts.some((p) => p === '..' || p === '')) {
    throw new Error(`Rejected path-traversal zip entry: ${name}`);
  }
  return normalized;
}

/**
 * Minimal ZIP reader (store + deflate) with zip-slip and size guards.
 * Used for Drugs@FDA bulk ZIP fixtures and local extracts.
 */
export function safeExtractZip(buffer: Buffer, opts?: { maxFiles?: number; maxTotalBytes?: number; maxEntryBytes?: number }): ZipEntry[] {
  const maxFiles = opts?.maxFiles ?? MAX_FILES;
  const maxTotal = opts?.maxTotalBytes ?? MAX_TOTAL_BYTES;
  const maxEntry = opts?.maxEntryBytes ?? MAX_ENTRY_BYTES;
  if (buffer.length < 22) throw new Error('ZIP too small');

  // Find End of Central Directory
  let eocd = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i -= 1) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('ZIP EOCD not found');

  const totalEntries = buffer.readUInt16LE(eocd + 10);
  const centralOffset = buffer.readUInt32LE(eocd + 16);
  if (totalEntries > maxFiles) throw new Error(`ZIP file count ${totalEntries} exceeds cap ${maxFiles}`);

  const out: ZipEntry[] = [];
  let totalBytes = 0;
  let offset = centralOffset;

  for (let i = 0; i < totalEntries; i += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error('Invalid central directory signature');
    const compression = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const nameLen = buffer.readUInt16LE(offset + 28);
    const extraLen = buffer.readUInt16LE(offset + 30);
    const commentLen = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.subarray(offset + 46, offset + 46 + nameLen).toString('utf8');
    offset += 46 + nameLen + extraLen + commentLen;

    if (name.endsWith('/')) continue;
    const safePath = assertSafeZipEntryPath(name);
    if (uncompressedSize > maxEntry) throw new Error(`ZIP entry too large: ${safePath}`);
    totalBytes += uncompressedSize;
    if (totalBytes > maxTotal) throw new Error('ZIP total uncompressed size exceeds cap');

    if (buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) throw new Error('Invalid local file header');
    const localNameLen = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLen = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);

    let bytes: Buffer;
    if (compression === 0) {
      bytes = Buffer.from(compressed);
    } else if (compression === 8) {
      bytes = inflateRawSync(compressed);
    } else {
      throw new Error(`Unsupported ZIP compression method ${compression} for ${safePath}`);
    }
    if (bytes.length !== uncompressedSize && uncompressedSize !== 0) {
      // allow mismatch only when sizes were 0/unknown; still enforce max
      if (bytes.length > maxEntry) throw new Error(`Inflated entry too large: ${safePath}`);
    }
    out.push({ path: safePath, bytes });
  }

  return out;
}

export function parseDrugsAtFdaProductsTxt(text: string): Array<{
  applicationNumber: string;
  productNumber: string;
  brandName: string;
  activeIngredient: string;
  form: string;
  strength: string;
  marketingStatus: string;
}> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const header = lines[0]!.split('\t').map((h) => h.trim().toLowerCase());
  const required = ['applno', 'productno', 'form', 'strength', 'drugname', 'activeingredient', 'marketingstatus'];
  for (const col of required) {
    if (!header.includes(col)) {
      throw new Error(`Drugs@FDA Products.txt missing required column: ${col}`);
    }
  }
  const idx = (name: string) => header.indexOf(name);
  return lines.slice(1).map((line) => {
    const cols = line.split('\t');
    return {
      applicationNumber: cols[idx('applno')] ?? '',
      productNumber: cols[idx('productno')] ?? '',
      brandName: cols[idx('drugname')] ?? '',
      activeIngredient: cols[idx('activeingredient')] ?? '',
      form: cols[idx('form')] ?? '',
      strength: cols[idx('strength')] ?? '',
      marketingStatus: cols[idx('marketingstatus')] ?? '',
    };
  });
}

/** Stage → validate → return current projection rows (idempotent by content). */
export function projectDrugsAtFdaZip(buffer: Buffer) {
  const entries = safeExtractZip(buffer);
  const productsEntry = entries.find((e) => /(^|\/)Products\.txt$/i.test(e.path));
  if (!productsEntry) throw new Error('Drugs@FDA ZIP missing Products.txt');
  const products = parseDrugsAtFdaProductsTxt(productsEntry.bytes.toString('utf8'));
  const contentFingerprint = createHash('sha256')
    .update(
      entries
        .map((e) => `${e.path}:${createHash('sha256').update(e.bytes).digest('hex')}`)
        .sort()
        .join('|'),
    )
    .digest('hex');
  return {
    entryCount: entries.length,
    entryPaths: entries.map((e) => e.path),
    products,
    releaseFingerprint: contentFingerprint,
  };
}
