import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { gunzipSync, gzipSync } from 'node:zlib';
import { rawSnapshotRelativeKey } from './paths.js';

export type StoredRawSnapshot = {
  sha256: string;
  storageKey: string;
  byteLength: number;
  compressedByteLength: number;
  absolutePath: string;
  reused: boolean;
};

function assertNoTraversal(storageKey: string) {
  if (storageKey.includes('..') || path.isAbsolute(storageKey)) {
    throw new Error(`Invalid storage key: ${storageKey}`);
  }
}

export class FileRawSnapshotStore {
  constructor(private readonly rawDir: string) {}

  put(bytes: Buffer, ext: string): StoredRawSnapshot {
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    const storageKey = rawSnapshotRelativeKey(sha256, ext);
    assertNoTraversal(storageKey);
    const absolutePath = path.join(this.rawDir, storageKey);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });

    if (fs.existsSync(absolutePath)) {
      const existing = fs.readFileSync(absolutePath);
      const existingHash = createHash('sha256').update(gunzipSync(existing)).digest('hex');
      if (existingHash !== sha256) {
        throw new Error(`Raw snapshot hash mismatch for ${storageKey}`);
      }
      return {
        sha256,
        storageKey,
        byteLength: bytes.length,
        compressedByteLength: existing.length,
        absolutePath,
        reused: true,
      };
    }

    const compressed = gzipSync(bytes);
    const tmp = `${absolutePath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmp, compressed);
    fs.renameSync(tmp, absolutePath);

    return {
      sha256,
      storageKey,
      byteLength: bytes.length,
      compressedByteLength: compressed.length,
      absolutePath,
      reused: false,
    };
  }

  get(storageKey: string): Buffer {
    assertNoTraversal(storageKey);
    const absolutePath = path.join(this.rawDir, storageKey);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Raw snapshot missing: ${storageKey}`);
    }
    return gunzipSync(fs.readFileSync(absolutePath));
  }

  exists(storageKey: string): boolean {
    assertNoTraversal(storageKey);
    return fs.existsSync(path.join(this.rawDir, storageKey));
  }
}
