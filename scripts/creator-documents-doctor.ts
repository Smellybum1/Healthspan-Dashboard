import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  closeDatabase,
  openDatabase,
  creatorDocuments,
  creatorDocumentSegments,
} from '@healthspan/db';

const { db, sqlite, paths } = openDatabase({
  allowRelativeOverride: process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR === '1',
  migrateOnOpen: true,
});

const failures: string[] = [];
const documents = db.select().from(creatorDocuments).all();
const segments = db.select().from(creatorDocumentSegments).all();
const docIds = new Set(documents.map((d) => d.id));

const orphanSegments = segments.filter((s) => !docIds.has(s.documentId));
if (orphanSegments.length > 0) failures.push(`orphan segments: ${orphanSegments.length}`);

const deletedWithBytes = documents.filter((d) => {
  if (d.lifecycleState !== 'deleted' && !d.deletedAt) return false;
  if (d.storagePurged) return false;
  if (!d.storageKey) return false;
  const abs = join(paths.dataDir, d.storageKey);
  return existsSync(abs) && statSync(abs).size > 0;
});
if (deletedWithBytes.length > 0) {
  failures.push(`deleted documents still have bytes: ${deletedWithBytes.length}`);
}

const missingRights = documents.filter(
  (d) => d.lifecycleState !== 'deleted' && !d.deletedAt && !d.rightsBasis,
);
if (missingRights.length > 0) failures.push(`documents missing rightsBasis: ${missingRights.length}`);

const fullTranscriptExposed = documents.some(
  (d) =>
    d.lifecycleState !== 'deleted' &&
    !d.deletedAt &&
    typeof d.parsedTextExcerpt === 'string' &&
    d.parsedTextExcerpt.length > 20_000,
);
if (fullTranscriptExposed) failures.push('full transcript excerpt exceeds safe API bound');

const report = {
  suite: 'creator-documents:doctor',
  documentCount: documents.length,
  segmentCount: segments.length,
  orphanSegments: orphanSegments.length,
  deletedWithBytes: deletedWithBytes.length,
  missingRights: missingRights.length,
  ok: failures.length === 0,
  failures,
  notes: [
    'No full transcript browser export.',
    'Deleted documents must purge bytes and segments.',
  ],
};

console.log(JSON.stringify(report, null, 2));
closeDatabase(sqlite);
process.exit(report.ok ? 0 : 1);
