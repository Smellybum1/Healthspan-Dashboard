import { createHash, randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import {
  createClinicalTrialsConnector,
  createCrossrefConnector,
  createPubmedConnector,
  createTgaConnector,
  type ConnectorId,
  type FetchTransport,
  type SourceConnector,
} from '@healthspan/connectors';
import {
  FileRawSnapshotStore,
  changeEvents,
  contentItems,
  contentItemSources,
  externalIdentifiers,
  ingestionRunErrors,
  ingestionRunSnapshots,
  ingestionRuns,
  papers,
  regulatoryEvents,
  sourceObjects,
  sourceRecordVersions,
  sources,
  trialConditions,
  trialInterventions,
  trialLocations,
  trialOutcomes,
  trialStatusHistory,
  trials,
  rawSnapshots,
  type HealthspanDb,
} from '@healthspan/db';

export type IngestOptions = {
  db: HealthspanDb;
  rawStore: FileRawSnapshotStore;
  sourceId: ConnectorId | 'all';
  trigger: 'manual' | 'scheduled' | 'startup_catchup' | 'cli' | 'reprocess' | 'test';
  lookbackDays?: number;
  recordCap?: number;
  transport?: FetchTransport;
  crossrefDois?: string[];
  isBaseline?: boolean;
};

function now() {
  return Date.now();
}

function parseMaybeDate(value: unknown): number | null {
  if (!value) return null;
  const t = Date.parse(String(value));
  return Number.isFinite(t) ? t : null;
}

function buildConnectors(opts: IngestOptions): SourceConnector[] {
  const transport = opts.transport;
  const all: SourceConnector[] = [
    createPubmedConnector({
      transport,
      tool: process.env.NCBI_TOOL,
      email: process.env.NCBI_EMAIL,
      apiKey: process.env.NCBI_API_KEY,
    }),
    createClinicalTrialsConnector({ transport }),
    createCrossrefConnector({
      transport,
      mailto: process.env.CROSSREF_MAILTO,
      dois: opts.crossrefDois,
    }),
    createTgaConnector({ transport }),
  ];
  if (opts.sourceId === 'all') return all;
  return all.filter((c) => c.id === opts.sourceId);
}

export async function runIngestion(opts: IngestOptions) {
  const started = now();
  const parentRunId = randomUUID();
  const connectors = buildConnectors(opts);
  const lookbackDays = opts.lookbackDays ?? Number(process.env.HEALTHSPAN_PUBMED_INITIAL_LOOKBACK_DAYS ?? 90);
  const recordCap = opts.recordCap ?? Number(process.env.HEALTHSPAN_FIRST_RUN_RECORD_CAP ?? 1000);

  opts.db
    .insert(ingestionRuns)
    .values({
      id: parentRunId,
      sourceId: null,
      trigger: opts.trigger,
      status: 'running',
      startedAt: started,
    })
    .run();

  let totalContent = 0;
  let totalEvents = 0;
  let totalErrors = 0;
  const childSummaries: string[] = [];

  for (const connector of connectors) {
    const sourceRow = opts.db.select().from(sources).where(eq(sources.id, connector.id)).all()[0];
    const isBaseline =
      opts.isBaseline === true
        ? true
        : opts.isBaseline === false
          ? false
          : sourceRow?.baselineCompletedAt == null;
    const childId = randomUUID();
    const childStart = now();
    opts.db
      .insert(ingestionRuns)
      .values({
        id: childId,
        sourceId: connector.id,
        parentRunId,
        trigger: opts.trigger,
        status: 'running',
        startedAt: childStart,
      })
      .run();

    opts.db
      .update(sources)
      .set({ healthState: 'running', lastAttemptAt: childStart, updatedAt: childStart })
      .where(eq(sources.id, connector.id))
      .run();

    const result = await connector.fetchWindow({
      cursor: {},
      lookbackDays:
        connector.id === 'clinicaltrials-gov'
          ? Number(process.env.HEALTHSPAN_CLINICALTRIALS_INITIAL_LOOKBACK_DAYS ?? 365)
          : lookbackDays,
      recordCap,
      transport: opts.transport,
    });

    let newObjects = 0;
    let newVersions = 0;
    let unchanged = 0;
    let contentUpserts = 0;
    let changeCount = 0;
    let rawCount = 0;

    try {
      const snapshotIds: string[] = [];
      for (const body of result.rawBodies) {
        const stored = opts.rawStore.put(body.bytes, body.ext);
        rawCount += 1;
        const snapId = randomUUID();
        // insert via raw SQL-like drizzle values on raw_snapshots through dynamic import avoidance:
        // use db.run with prepared insert through schema
        opts.db
          .insert(rawSnapshots)
          .values({
            id: snapId,
            sourceId: connector.id,
            sha256: stored.sha256,
            storageKey: stored.storageKey,
            mediaType: body.mediaType,
            compression: 'gzip',
            byteLength: stored.byteLength,
            compressedByteLength: stored.compressedByteLength,
            retrievedAt: childStart,
            etag: body.etag,
            lastModified: body.lastModified,
            connectorVersion: 'm2.0.0',
            parserVersion: 'm2.0.0',
          })
          .onConflictDoNothing()
          .run();
        snapshotIds.push(snapId);
        opts.db
          .insert(ingestionRunSnapshots)
          .values({ runId: childId, rawSnapshotId: snapId })
          .onConflictDoNothing()
          .run();
      }

      const primarySnap = snapshotIds[0] ?? randomUUID();
      if (snapshotIds.length === 0) {
        // synthetic empty snapshot metadata omitted
      }

      for (const page of result.pages) {
        const normalizedHash = String(page.normalized.normalizedHash ?? createHash('sha256').update(JSON.stringify(page.normalized)).digest('hex'));
        const existingObj = opts.db
          .select()
          .from(sourceObjects)
          .where(and(eq(sourceObjects.sourceId, connector.id), eq(sourceObjects.externalId, page.externalId)))
          .all()[0];

        let sourceObjectId = existingObj?.id;
        if (!sourceObjectId) {
          sourceObjectId = randomUUID();
          opts.db
            .insert(sourceObjects)
            .values({
              id: sourceObjectId,
              sourceId: connector.id,
              externalId: page.externalId,
              firstSeenAt: childStart,
              lastSeenAt: childStart,
              sourceCreatedAt: parseMaybeDate(page.sourceCreatedAt),
              sourceUpdatedAt: parseMaybeDate(page.sourceUpdatedAt),
              canonicalUrl: page.canonicalUrl,
            })
            .run();
          newObjects += 1;
        } else {
          opts.db
            .update(sourceObjects)
            .set({
              lastSeenAt: childStart,
              sourceUpdatedAt: parseMaybeDate(page.sourceUpdatedAt) ?? existingObj?.sourceUpdatedAt,
              canonicalUrl: page.canonicalUrl ?? existingObj?.canonicalUrl,
            })
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
          (opts.db
            .select()
            .from(sourceRecordVersions)
            .where(eq(sourceRecordVersions.sourceObjectId, sourceObjectId))
            .all().length ?? 0) + 1;

        const versionId = randomUUID();
        const snapForVersion = snapshotIds[0] ?? primarySnap;
        if (snapshotIds.length === 0) {
          // Ensure FK: create placeholder raw snapshot metadata pointing at empty object
          const empty = Buffer.from('{}', 'utf8');
          const stored = opts.rawStore.put(empty, 'json');
          opts.db
            .insert(rawSnapshots)
            .values({
              id: snapForVersion,
              sourceId: connector.id,
              sha256: stored.sha256,
              storageKey: stored.storageKey,
              mediaType: 'application/json',
              compression: 'gzip',
              byteLength: stored.byteLength,
              compressedByteLength: stored.compressedByteLength,
              retrievedAt: childStart,
              connectorVersion: 'm2.0.0',
              parserVersion: 'm2.0.0',
            })
            .onConflictDoNothing()
            .run();
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
            firstObservedAt: childStart,
            parserVersion: 'm2.0.0',
            validationStatus: 'ok',
          })
          .run();
        newVersions += 1;

        opts.db
          .update(sourceObjects)
          .set({ currentVersionId: versionId })
          .where(eq(sourceObjects.id, sourceObjectId))
          .run();

        const upserted = upsertContentFromNormalized(opts.db, connector.id, sourceObjectId, versionId, page.normalized, childStart, isBaseline);
        contentUpserts += upserted.content;
        changeCount += upserted.events;
      }

      const status = result.ok ? (result.warnings?.length ? 'partial' : 'succeeded') : 'failed';
      opts.db
        .update(ingestionRuns)
        .set({
          status,
          completedAt: now(),
          remoteRecordCount: result.pages.length,
          rawSnapshotCount: rawCount,
          newObjectCount: newObjects,
          newVersionCount: newVersions,
          unchangedCount: unchanged,
          contentUpsertCount: contentUpserts,
          changeEventCount: changeCount,
          warningCount: result.warnings?.length ?? 0,
          errorCount: result.ok ? 0 : 1,
          summary: result.errorMessage ?? `${connector.id}: ${result.pages.length} records`,
          cursorAfterJson: JSON.stringify(result.nextCursor ?? {}),
        })
        .where(eq(ingestionRuns.id, childId))
        .run();

      opts.db
        .update(sources)
        .set({
          healthState: result.ok ? 'healthy' : 'failed',
          lastSuccessAt: result.ok ? now() : undefined,
          lastFailureAt: result.ok ? undefined : now(),
          consecutiveFailures: result.ok ? 0 : 1,
          lastError: result.errorMessage ?? null,
          baselineCompletedAt:
            result.ok && isBaseline
              ? sourceRow?.baselineCompletedAt ?? now()
              : sourceRow?.baselineCompletedAt ?? undefined,
          updatedAt: now(),
        })
        .where(eq(sources.id, connector.id))
        .run();

      totalContent += contentUpserts;
      totalEvents += changeCount;
      if (!result.ok) totalErrors += 1;
      childSummaries.push(`${connector.id}:${status}:${result.pages.length}`);
    } catch (err) {
      totalErrors += 1;
      const message = err instanceof Error ? err.message : 'ingestion failed';
      opts.db
        .insert(ingestionRunErrors)
        .values({
          id: randomUUID(),
          runId: childId,
          sourceId: connector.id,
          stage: 'persist',
          errorCode: 'INGEST_PERSIST_FAILED',
          message,
          retryable: false,
          createdAt: now(),
        })
        .run();
      opts.db
        .update(ingestionRuns)
        .set({ status: 'failed', completedAt: now(), errorCount: 1, summary: message })
        .where(eq(ingestionRuns.id, childId))
        .run();
      opts.db
        .update(sources)
        .set({
          healthState: 'failed',
          lastFailureAt: now(),
          consecutiveFailures: 1,
          lastError: message,
          updatedAt: now(),
        })
        .where(eq(sources.id, connector.id))
        .run();
      childSummaries.push(`${connector.id}:failed`);
    }
  }

  const parentStatus = totalErrors === 0 ? 'succeeded' : totalErrors === connectors.length ? 'failed' : 'partial';
  opts.db
    .update(ingestionRuns)
    .set({
      status: parentStatus,
      completedAt: now(),
      contentUpsertCount: totalContent,
      changeEventCount: totalEvents,
      errorCount: totalErrors,
      summary: childSummaries.join('; '),
    })
    .where(eq(ingestionRuns.id, parentRunId))
    .run();

  return {
    parentRunId,
    status: parentStatus,
    contentUpserts: totalContent,
    changeEvents: totalEvents,
    errors: totalErrors,
    summaries: childSummaries,
  };
}

function upsertContentFromNormalized(
  db: HealthspanDb,
  sourceId: string,
  sourceObjectId: string,
  versionId: string,
  normalized: Record<string, unknown>,
  at: number,
  isBaseline: boolean,
) {
  const type = String(normalized.type ?? '');
  let content = 0;
  let events = 0;

  if (type === 'paper' || type === 'paper_enrichment') {
    const pmid = normalized.pmid ? String(normalized.pmid) : null;
    const doi = normalized.doi ? String(normalized.doi) : null;
    let contentId: string | undefined;
    if (pmid) {
      contentId = db.select().from(externalIdentifiers).where(and(eq(externalIdentifiers.scheme, 'pmid'), eq(externalIdentifiers.value, pmid))).all()[0]?.contentItemId;
    }
    if (!contentId && doi) {
      contentId = db.select().from(externalIdentifiers).where(and(eq(externalIdentifiers.scheme, 'doi'), eq(externalIdentifiers.value, doi))).all()[0]?.contentItemId;
    }
    const isNew = !contentId;
    contentId = contentId ?? randomUUID();
    if (isNew) {
      db.insert(contentItems)
        .values({
          id: contentId,
          type: 'paper',
          dataOrigin: 'live',
          title: String(normalized.title ?? pmid ?? doi ?? 'Untitled paper'),
          summary: normalized.summary ? String(normalized.summary) : null,
          sourcePublishedAt: parseMaybeDate(normalized.publishedAt),
          sourceUpdatedAt: parseMaybeDate(normalized.deposited),
          firstSeenAt: at,
          lastSeenAt: at,
          canonicalUrl: normalized.canonicalUrl ? String(normalized.canonicalUrl) : null,
          recordStatus: 'active',
          createdAt: at,
          updatedAt: at,
        })
        .run();
      db.insert(papers)
        .values({
          contentItemId: contentId,
          pmid,
          doi,
          journal: normalized.journal ? String(normalized.journal) : null,
          publisher: normalized.publisher ? String(normalized.publisher) : null,
          licence: normalized.licence ? String(normalized.licence) : null,
          isCorrectionOrRetraction: Boolean(normalized.updateTo),
        })
        .run();
      if (pmid) {
        db.insert(externalIdentifiers)
          .values({ id: randomUUID(), contentItemId: contentId, scheme: 'pmid', value: pmid, sourceId })
          .onConflictDoNothing()
          .run();
      }
      if (doi) {
        db.insert(externalIdentifiers)
          .values({ id: randomUUID(), contentItemId: contentId, scheme: 'doi', value: doi, sourceId })
          .onConflictDoNothing()
          .run();
      }
      content += 1;
      if (!isBaseline) {
        db.insert(changeEvents)
          .values({
            id: randomUUID(),
            kind: 'new_paper',
            title: `New paper: ${String(normalized.title ?? contentId)}`,
            summary: normalized.summary ? String(normalized.summary).slice(0, 280) : null,
            occurredAt: at,
            detectedAt: at,
            contentItemId: contentId,
            sourceObjectId,
            sourceRecordVersionId: versionId,
            importance: 'medium',
            isBaseline: false,
            dedupeKey: `new_paper:${contentId}:${versionId}`,
            dataOrigin: 'live',
          })
          .onConflictDoNothing()
          .run();
        events += 1;
      }
    } else {
      db.update(contentItems)
        .set({
          lastSeenAt: at,
          updatedAt: at,
          title: String(normalized.title ?? 'Untitled paper'),
          summary: normalized.summary ? String(normalized.summary) : null,
          canonicalUrl: normalized.canonicalUrl ? String(normalized.canonicalUrl) : null,
        })
        .where(eq(contentItems.id, contentId))
        .run();
      content += 1;
    }

    db.insert(contentItemSources)
      .values({
        contentItemId: contentId,
        sourceObjectId,
        role: type === 'paper_enrichment' ? 'enrichment' : 'primary',
        firstLinkedAt: at,
        lastLinkedAt: at,
      })
      .onConflictDoNothing()
      .run();
  }

  if (type === 'trial') {
    const nctId = String(normalized.nctId);
    let contentId = db
      .select()
      .from(externalIdentifiers)
      .where(and(eq(externalIdentifiers.scheme, 'nct'), eq(externalIdentifiers.value, nctId)))
      .all()[0]?.contentItemId;
    const isNew = !contentId;
    contentId = contentId ?? randomUUID();
    if (isNew) {
      db.insert(contentItems)
        .values({
          id: contentId,
          type: 'trial',
          dataOrigin: 'live',
          title: String(normalized.title ?? nctId),
          summary: normalized.summary ? String(normalized.summary) : null,
          firstSeenAt: at,
          lastSeenAt: at,
          canonicalUrl: normalized.canonicalUrl ? String(normalized.canonicalUrl) : null,
          recordStatus: 'active',
          createdAt: at,
          updatedAt: at,
        })
        .run();
      db.insert(trials)
        .values({
          contentItemId: contentId,
          nctId,
          overallStatus: String(normalized.overallStatus ?? 'unknown'),
          studyType: normalized.studyType ? String(normalized.studyType) : null,
          phasesJson: JSON.stringify(normalized.phases ?? []),
          briefTitle: String(normalized.title ?? nctId),
          officialTitle: normalized.summary ? String(normalized.summary) : null,
          sponsor: normalized.sponsor ? String(normalized.sponsor) : null,
          resultsPosted: Boolean(normalized.resultsPosted),
          healthyVolunteers:
            typeof normalized.healthyVolunteers === 'boolean' ? normalized.healthyVolunteers : null,
          minAgeText: normalized.minAgeText ? String(normalized.minAgeText) : null,
          maxAgeText: normalized.maxAgeText ? String(normalized.maxAgeText) : null,
          sexEligibility: normalized.sexEligibility ? String(normalized.sexEligibility) : null,
          australiaLocation: Boolean(normalized.australiaLocation),
          startDate: (normalized.dates as { start?: string | null } | undefined)?.start ?? null,
          primaryCompletionDate:
            (normalized.dates as { primaryCompletion?: string | null } | undefined)?.primaryCompletion ?? null,
          completionDate: (normalized.dates as { completion?: string | null } | undefined)?.completion ?? null,
          firstPostedDate: (normalized.dates as { firstPosted?: string | null } | undefined)?.firstPosted ?? null,
          lastUpdatePostedDate:
            (normalized.dates as { lastUpdatePosted?: string | null } | undefined)?.lastUpdatePosted ?? null,
          resultsFirstPostedDate:
            (normalized.dates as { resultsFirstPosted?: string | null } | undefined)?.resultsFirstPosted ?? null,
        })
        .run();
      db.insert(externalIdentifiers)
        .values({ id: randomUUID(), contentItemId: contentId, scheme: 'nct', value: nctId, sourceId })
        .run();

      for (const condition of (normalized.conditions as string[] | undefined) ?? []) {
        db.insert(trialConditions)
          .values({ id: randomUUID(), trialId: contentId, name: condition })
          .run();
      }
      for (const intervention of (normalized.interventions as Array<{ name?: string; type?: string }> | undefined) ?? []) {
        if (!intervention.name) continue;
        db.insert(trialInterventions)
          .values({
            id: randomUUID(),
            trialId: contentId,
            name: intervention.name,
            type: intervention.type ?? null,
          })
          .run();
      }
      for (const outcome of (normalized.outcomes as Array<{ measure?: string; description?: string; timeFrame?: string }> | undefined) ?? []) {
        db.insert(trialOutcomes)
          .values({
            id: randomUUID(),
            trialId: contentId,
            outcomeType: 'primary',
            measure: outcome.measure ?? null,
            description: outcome.description ?? null,
            timeFrame: outcome.timeFrame ?? null,
          })
          .run();
      }
      for (const loc of (normalized.locations as Array<Record<string, string | undefined>> | undefined) ?? []) {
        db.insert(trialLocations)
          .values({
            id: randomUUID(),
            trialId: contentId,
            facility: loc.facility ?? null,
            city: loc.city ?? null,
            state: loc.state ?? null,
            postcode: loc.zip ?? null,
            country: loc.country ?? null,
          })
          .run();
      }

      const status = String(normalized.overallStatus ?? 'unknown');
      db.insert(trialStatusHistory)
        .values({
          id: randomUUID(),
          trialId: contentId,
          status,
          detectedAt: at,
          sourceRecordVersionId: versionId,
          eventKey: `${nctId}:${status}:initial`,
        })
        .run();

      content += 1;
      if (!isBaseline) {
        db.insert(changeEvents)
          .values({
            id: randomUUID(),
            kind: 'new_trial',
            title: `New trial: ${nctId}`,
            summary: String(normalized.title ?? nctId),
            occurredAt: at,
            detectedAt: at,
            contentItemId: contentId,
            sourceObjectId,
            sourceRecordVersionId: versionId,
            importance: 'medium',
            isBaseline: false,
            dedupeKey: `new_trial:${nctId}:${versionId}`,
            dataOrigin: 'live',
          })
          .onConflictDoNothing()
          .run();
        events += 1;
      }
    } else {
      const previous = db.select().from(trials).where(eq(trials.contentItemId, contentId)).all()[0];
      const nextStatus = String(normalized.overallStatus ?? 'unknown');
      db.update(trials)
        .set({
          overallStatus: nextStatus,
          resultsPosted: Boolean(normalized.resultsPosted),
          australiaLocation: Boolean(normalized.australiaLocation),
          lastUpdatePostedDate:
            (normalized.dates as { lastUpdatePosted?: string | null } | undefined)?.lastUpdatePosted ??
            previous?.lastUpdatePostedDate ??
            null,
        })
        .where(eq(trials.contentItemId, contentId))
        .run();
      db.update(contentItems).set({ lastSeenAt: at, updatedAt: at }).where(eq(contentItems.id, contentId)).run();
      if (previous && previous.overallStatus !== nextStatus) {
        db.insert(trialStatusHistory)
          .values({
            id: randomUUID(),
            trialId: contentId,
            status: nextStatus,
            detectedAt: at,
            sourceRecordVersionId: versionId,
            eventKey: `${nctId}:${nextStatus}:${versionId}`,
          })
          .onConflictDoNothing()
          .run();
        if (!isBaseline) {
          db.insert(changeEvents)
            .values({
              id: randomUUID(),
              kind: 'trial_status_change',
              title: `Trial status changed: ${nctId}`,
              summary: `${previous.overallStatus} → ${nextStatus}`,
              occurredAt: at,
              detectedAt: at,
              contentItemId: contentId,
              sourceObjectId,
              sourceRecordVersionId: versionId,
              importance: 'high',
              isBaseline: false,
              dedupeKey: `trial_status:${nctId}:${previous.overallStatus}:${nextStatus}:${versionId}`,
              dataOrigin: 'live',
            })
            .onConflictDoNothing()
            .run();
          events += 1;
        }
      }
      content += 1;
    }

    db.insert(contentItemSources)
      .values({
        contentItemId: contentId,
        sourceObjectId,
        role: 'primary',
        firstLinkedAt: at,
        lastLinkedAt: at,
      })
      .onConflictDoNothing()
      .run();
  }

  if (type === 'regulatory_event') {
    const guid = String(normalized.guid);
    let contentId = db
      .select()
      .from(externalIdentifiers)
      .where(and(eq(externalIdentifiers.scheme, 'tga-guid'), eq(externalIdentifiers.value, guid)))
      .all()[0]?.contentItemId;
    const isNew = !contentId;
    contentId = contentId ?? randomUUID();
    if (isNew) {
      db.insert(contentItems)
        .values({
          id: contentId,
          type: 'regulatory_event',
          dataOrigin: 'live',
          title: String(normalized.title ?? guid),
          summary: normalized.summary ? String(normalized.summary) : null,
          sourcePublishedAt: parseMaybeDate(normalized.publishedAt),
          firstSeenAt: at,
          lastSeenAt: at,
          canonicalUrl: normalized.officialUrl ? String(normalized.officialUrl) : null,
          recordStatus: 'active',
          createdAt: at,
          updatedAt: at,
        })
        .run();
      db.insert(regulatoryEvents)
        .values({
          contentItemId: contentId,
          jurisdiction: 'AU',
          authority: 'TGA',
          feedKey: normalized.feedKey ? String(normalized.feedKey) : null,
          category: normalized.category ? String(normalized.category) : null,
          guid,
          publishedAt: parseMaybeDate(normalized.publishedAt),
          officialUrl: normalized.officialUrl ? String(normalized.officialUrl) : null,
          relevanceMatched: Boolean(normalized.relevanceMatched),
          relevanceTermsJson: JSON.stringify(normalized.relevanceTerms ?? []),
        })
        .run();
      db.insert(externalIdentifiers)
        .values({ id: randomUUID(), contentItemId: contentId, scheme: 'tga-guid', value: guid, sourceId })
        .run();
      content += 1;
      if (!isBaseline && normalized.relevanceMatched) {
        db.insert(changeEvents)
          .values({
            id: randomUUID(),
            kind: 'safety_alert',
            title: String(normalized.title ?? 'TGA update'),
            summary: normalized.summary ? String(normalized.summary).slice(0, 280) : null,
            occurredAt: parseMaybeDate(normalized.publishedAt) ?? at,
            detectedAt: at,
            contentItemId: contentId,
            sourceObjectId,
            sourceRecordVersionId: versionId,
            importance: 'high',
            isBaseline: false,
            dedupeKey: `tga:${guid}:${versionId}`,
            dataOrigin: 'live',
          })
          .onConflictDoNothing()
          .run();
        events += 1;
      }
    } else {
      db.update(contentItems).set({ lastSeenAt: at, updatedAt: at }).where(eq(contentItems.id, contentId)).run();
      content += 1;
    }

    db.insert(contentItemSources)
      .values({
        contentItemId: contentId,
        sourceObjectId,
        role: 'primary',
        firstLinkedAt: at,
        lastLinkedAt: at,
      })
      .onConflictDoNothing()
      .run();
  }

  return { content, events };
}
