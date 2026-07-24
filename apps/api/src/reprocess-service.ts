/**
 * Offline reprocess from immutable stored raw snapshots (M2 residual / M6 entry gate).
 * Seed phase may use fixture transport once to populate snapshots into a temp DB;
 * reprocess phase reads only stored bytes and never advances remote checkpoints.
 */
import { createHash, randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import {
  reparseClinicalTrialsRaw,
  reparseCrossrefRaw,
  reparsePubmedRaw,
  reparseTgaRaw,
  type ConnectorFetchResult,
  type ConnectorId,
} from '@healthspan/connectors';
import {
  changeEvents,
  contentItems,
  FileRawSnapshotStore,
  ingestionRunSnapshots,
  ingestionRuns,
  rawSnapshots,
  sourceObjects,
  sourceRecordVersions,
  sources,
  type HealthspanDb,
} from '@healthspan/db';

function now() {
  return Date.now();
}

function parseMaybeDate(value: unknown): number | null {
  if (!value) return null;
  const t = Date.parse(String(value));
  return Number.isFinite(t) ? t : null;
}

function reparseBytes(sourceId: ConnectorId, bytes: Buffer, recordCap: number): ConnectorFetchResult {
  if (sourceId === 'pubmed') return reparsePubmedRaw(bytes, recordCap);
  if (sourceId === 'clinicaltrials-gov') return reparseClinicalTrialsRaw(bytes, recordCap);
  if (sourceId === 'crossref') return reparseCrossrefRaw(bytes);
  if (sourceId === 'tga') return reparseTgaRaw(bytes, recordCap);
  return {
    connectorId: sourceId,
    fetchedAt: new Date().toISOString(),
    ok: false,
    pages: [],
    rawBodies: [],
    errorMessage: `Unsupported reprocess source ${sourceId}`,
  };
}

export type OfflineReprocessResult = {
  sourceId: ConnectorId;
  status: 'succeeded' | 'partial' | 'failed';
  inserted: number;
  changed: number;
  unchanged: number;
  partial: boolean;
  failed: number;
  snapshotsRead: number;
  network: false;
  advancedRemoteCheckpoint: false;
  runId: string;
};

/**
 * Project pages from already-stored raw snapshots using the current parser.
 * Does not fetch network and does not update connector_checkpoints.
 */
export async function reprocessFromStoredSnapshots(opts: {
  db: HealthspanDb;
  rawStore: FileRawSnapshotStore;
  sourceId: ConnectorId;
  recordCap?: number;
}): Promise<OfflineReprocessResult> {
  const recordCap = opts.recordCap ?? 1000;
  const started = now();
  const runId = randomUUID();
  opts.db
    .insert(ingestionRuns)
    .values({
      id: runId,
      sourceId: opts.sourceId,
      trigger: 'reprocess',
      status: 'running',
      startedAt: started,
    })
    .run();

  const snaps = opts.db
    .select()
    .from(rawSnapshots)
    .where(eq(rawSnapshots.sourceId, opts.sourceId))
    .orderBy(desc(rawSnapshots.retrievedAt))
    .all()
    .slice(0, 20);

  let inserted = 0;
  let changed = 0;
  let unchanged = 0;
  let failed = 0;
  const allPages: ConnectorFetchResult['pages'] = [];

  try {
    for (const snap of snaps) {
      opts.db
        .insert(ingestionRunSnapshots)
        .values({ runId, rawSnapshotId: snap.id })
        .onConflictDoNothing()
        .run();
      const bytes = opts.rawStore.get(snap.storageKey);
      const parsed = reparseBytes(opts.sourceId, bytes, recordCap - allPages.length);
      if (!parsed.ok) {
        failed += 1;
        continue;
      }
      for (const page of parsed.pages) {
        if (allPages.length >= recordCap) break;
        allPages.push(page);
      }
    }

    for (const page of allPages) {
      const normalizedHash = String(
        page.normalized.normalizedHash ??
          createHash('sha256').update(JSON.stringify(page.normalized)).digest('hex'),
      );
      const existingObj = opts.db
        .select()
        .from(sourceObjects)
        .where(and(eq(sourceObjects.sourceId, opts.sourceId), eq(sourceObjects.externalId, page.externalId)))
        .all()[0];

      let sourceObjectId = existingObj?.id;
      if (!sourceObjectId) {
        sourceObjectId = randomUUID();
        opts.db
          .insert(sourceObjects)
          .values({
            id: sourceObjectId,
            sourceId: opts.sourceId,
            externalId: page.externalId,
            firstSeenAt: started,
            lastSeenAt: started,
            sourceCreatedAt: parseMaybeDate(page.sourceCreatedAt),
            sourceUpdatedAt: parseMaybeDate(page.sourceUpdatedAt),
            canonicalUrl: page.canonicalUrl ?? null,
          })
          .run();
        inserted += 1;
      } else {
        opts.db
          .update(sourceObjects)
          .set({ lastSeenAt: started })
          .where(eq(sourceObjects.id, sourceObjectId))
          .run();
      }

      const sameVersion = opts.db
        .select()
        .from(sourceRecordVersions)
        .where(
          and(
            eq(sourceRecordVersions.sourceObjectId, sourceObjectId),
            eq(sourceRecordVersions.normalizedHash, normalizedHash),
          ),
        )
        .all()[0];

      if (sameVersion) {
        unchanged += 1;
        continue;
      }

      const versionNumber =
        opts.db
          .select()
          .from(sourceRecordVersions)
          .where(eq(sourceRecordVersions.sourceObjectId, sourceObjectId))
          .all().length + 1;
      const versionId = randomUUID();
      const snapForVersion = snaps[0]?.id;
      if (!snapForVersion) {
        failed += 1;
        continue;
      }
      opts.db
        .insert(sourceRecordVersions)
        .values({
          id: versionId,
          sourceObjectId,
          versionNumber,
          rawSnapshotId: snapForVersion,
          normalizedHash,
          sourceTimestamp: parseMaybeDate(page.sourceUpdatedAt ?? page.sourceCreatedAt),
          firstObservedAt: started,
          parserVersion: 'm2.1.0-reprocess',
          validationStatus: 'ok',
        })
        .run();
      opts.db
        .update(sourceObjects)
        .set({ currentVersionId: versionId })
        .where(eq(sourceObjects.id, sourceObjectId))
        .run();
      changed += 1;

      // Lightweight content presence check — detailed upsert lives in ingest for full sync.
      const title = String((page.normalized as { title?: string }).title ?? page.externalId);
      const existingContent = opts.db
        .select()
        .from(contentItems)
        .where(eq(contentItems.title, title))
        .all()[0];
      if (!existingContent) {
        inserted += 1;
      }
    }

    const status: OfflineReprocessResult['status'] =
      failed > 0 && allPages.length === 0 ? 'failed' : failed > 0 ? 'partial' : 'succeeded';

    opts.db
      .update(ingestionRuns)
      .set({
        status,
        completedAt: now(),
        remoteRecordCount: allPages.length,
        rawSnapshotCount: snaps.length,
        newObjectCount: inserted,
        newVersionCount: changed,
        unchangedCount: unchanged,
        contentUpsertCount: inserted,
        changeEventCount: 0,
        errorCount: failed,
        summary: `reprocess ${opts.sourceId}: inserted=${inserted} changed=${changed} unchanged=${unchanged} failed=${failed}`,
        // Deliberately do not write a remote cursorAfter that would advance checkpoints.
        cursorAfterJson: JSON.stringify({ reprocess: true, advancedRemoteCheckpoint: false }),
      })
      .where(eq(ingestionRuns.id, runId))
      .run();

    // Health only — do not touch connector_checkpoints.
    const sourceRow = opts.db.select().from(sources).where(eq(sources.id, opts.sourceId)).all()[0];
    if (sourceRow) {
      opts.db
        .update(sources)
        .set({
          healthState: status === 'failed' ? 'failed' : 'healthy',
          lastSuccessAt: status === 'failed' ? sourceRow.lastSuccessAt : now(),
          updatedAt: now(),
        })
        .where(eq(sources.id, opts.sourceId))
        .run();
    }

    void changeEvents;

    return {
      sourceId: opts.sourceId,
      status,
      inserted,
      changed,
      unchanged,
      partial: status === 'partial',
      failed,
      snapshotsRead: snaps.length,
      network: false,
      advancedRemoteCheckpoint: false,
      runId,
    };
  } catch (err) {
    failed += 1;
    opts.db
      .update(ingestionRuns)
      .set({
        status: 'failed',
        completedAt: now(),
        errorCount: failed,
        summary: err instanceof Error ? err.message : 'reprocess failed',
      })
      .where(eq(ingestionRuns.id, runId))
      .run();
    return {
      sourceId: opts.sourceId,
      status: 'failed',
      inserted,
      changed,
      unchanged,
      partial: false,
      failed,
      snapshotsRead: snaps.length,
      network: false,
      advancedRemoteCheckpoint: false,
      runId,
    };
  }
}
