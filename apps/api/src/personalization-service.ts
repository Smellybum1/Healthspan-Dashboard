import { createHash, randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import {
  LOCAL_OWNER_PROFILE_ID,
  buildAlertDedupeKey,
  canonicalSearchHash,
  migrateSavedSearchQuery,
  previewLegacyPreferenceImport,
  selectBriefItems,
  sinceLastVisitWindow,
  slugifyWatchlistName,
} from '@healthspan/personalization';
import {
  alertRules,
  alerts,
  alertStateEvents,
  briefingSettings,
  briefs,
  briefItems,
  briefingRuns,
  changeEvents,
  localProfiles,
  muteRules,
  preferenceMigrationRuns,
  readingStates,
  readingStateEvents,
  savedSearches,
  savedSearchEvaluations,
  savedSearchMatches,
  visitSessions,
  watchableObjects,
  watchlistEntries,
  watchlists,
  type HealthspanDb,
} from '@healthspan/db';

function now() {
  return Date.now();
}

export function ensureLocalOwnerProfile(db: HealthspanDb) {
  const existing = db
    .select()
    .from(localProfiles)
    .where(eq(localProfiles.id, LOCAL_OWNER_PROFILE_ID))
    .all()[0];
  if (existing) return existing;
  const at = now();
  db.insert(localProfiles)
    .values({
      id: LOCAL_OWNER_PROFILE_ID,
      kind: 'local_single_user',
      active: true,
      timezone: 'Australia/Brisbane',
      schemaVersion: 1,
      createdAt: at,
      updatedAt: at,
    })
    .run();
  db.insert(watchlists)
    .values({
      id: randomUUID(),
      profileId: LOCAL_OWNER_PROFILE_ID,
      name: 'Following',
      slug: 'following',
      description: 'Default watchlist',
      isDefault: true,
      active: true,
      alertEnabled: true,
      briefEnabled: true,
      deletedAt: null,
      createdAt: at,
      updatedAt: at,
    })
    .run();
  db.insert(briefingSettings)
    .values({
      id: randomUUID(),
      profileId: LOCAL_OWNER_PROFILE_ID,
      dailyEnabled: true,
      weeklyEnabled: true,
      timezone: 'Australia/Brisbane',
      dailyTimeLocal: '07:15',
      weeklyTimeLocal: '09:00',
      weeklyWeekday: 0,
      maxDailyItems: 20,
      maxWeeklyItems: 40,
      updatedAt: at,
    })
    .run();
  return db
    .select()
    .from(localProfiles)
    .where(eq(localProfiles.id, LOCAL_OWNER_PROFILE_ID))
    .all()[0]!;
}

export function ensureWatchable(
  db: HealthspanDb,
  input: {
    dataOrigin: 'live' | 'demo';
    targetType: string;
    targetId: string;
    displayTitle?: string;
    canonicalUrl?: string;
  },
) {
  const existing = db
    .select()
    .from(watchableObjects)
    .where(
      and(
        eq(watchableObjects.dataOrigin, input.dataOrigin),
        eq(watchableObjects.targetType, input.targetType),
        eq(watchableObjects.targetId, input.targetId),
      ),
    )
    .all()[0];
  if (existing) return existing;
  const at = now();
  const id = randomUUID();
  db.insert(watchableObjects)
    .values({
      id,
      dataOrigin: input.dataOrigin,
      targetType: input.targetType,
      targetId: input.targetId,
      displayTitle: input.displayTitle ?? null,
      canonicalUrl: input.canonicalUrl ?? null,
      createdAt: at,
      updatedAt: at,
    })
    .run();
  return db.select().from(watchableObjects).where(eq(watchableObjects.id, id)).all()[0]!;
}

export function listWatchlists(db: HealthspanDb) {
  ensureLocalOwnerProfile(db);
  return db
    .select()
    .from(watchlists)
    .where(and(eq(watchlists.profileId, LOCAL_OWNER_PROFILE_ID), eq(watchlists.active, true)))
    .all();
}

export function createWatchlist(db: HealthspanDb, name: string, description?: string) {
  ensureLocalOwnerProfile(db);
  const at = now();
  const id = randomUUID();
  const slug = slugifyWatchlistName(name);
  db.insert(watchlists)
    .values({
      id,
      profileId: LOCAL_OWNER_PROFILE_ID,
      name,
      slug,
      description: description ?? null,
      isDefault: false,
      active: true,
      alertEnabled: false,
      briefEnabled: true,
      deletedAt: null,
      createdAt: at,
      updatedAt: at,
    })
    .run();
  return db.select().from(watchlists).where(eq(watchlists.id, id)).all()[0]!;
}

export function addWatchlistItem(
  db: HealthspanDb,
  watchlistId: string,
  target: { targetType: string; targetId: string; displayTitle?: string },
) {
  const watchable = ensureWatchable(db, {
    dataOrigin: 'live',
    targetType: target.targetType,
    targetId: target.targetId,
    displayTitle: target.displayTitle,
  });
  const at = now();
  db.insert(watchlistEntries)
    .values({
      id: randomUUID(),
      watchlistId,
      watchableId: watchable.id,
      priority: 100,
      state: 'active',
      source: 'user',
      addedAt: at,
    })
    .onConflictDoNothing()
    .run();
  return watchable;
}

export function listWatchlistItems(db: HealthspanDb, watchlistId: string) {
  const entries = db
    .select()
    .from(watchlistEntries)
    .where(and(eq(watchlistEntries.watchlistId, watchlistId), eq(watchlistEntries.state, 'active')))
    .all();
  return entries.map((e) => {
    const w = db
      .select()
      .from(watchableObjects)
      .where(eq(watchableObjects.id, e.watchableId))
      .all()[0];
    return { ...e, watchable: w ?? null };
  });
}

export function createSavedSearch(db: HealthspanDb, name: string, queryRaw: unknown) {
  ensureLocalOwnerProfile(db);
  const { query, needsUpdate } = migrateSavedSearchQuery(queryRaw);
  const at = now();
  const id = randomUUID();
  db.insert(savedSearches)
    .values({
      id,
      profileId: LOCAL_OWNER_PROFILE_ID,
      name,
      description: null,
      querySchemaVersion: 2,
      queryJson: JSON.stringify(query),
      canonicalHash: canonicalSearchHash(query),
      state: 'active',
      alertEnabled: false,
      briefEnabled: true,
      needsUpdate,
      createdAt: at,
      updatedAt: at,
    })
    .run();
  return db.select().from(savedSearches).where(eq(savedSearches.id, id)).all()[0]!;
}

export function listSavedSearches(db: HealthspanDb) {
  ensureLocalOwnerProfile(db);
  return db
    .select()
    .from(savedSearches)
    .where(eq(savedSearches.profileId, LOCAL_OWNER_PROFILE_ID))
    .all();
}

export function setReadingState(
  db: HealthspanDb,
  watchableId: string,
  readingState: 'unread' | 'opened' | 'read' | 'dismissed',
) {
  ensureLocalOwnerProfile(db);
  const at = now();
  const existing = db
    .select()
    .from(readingStates)
    .where(
      and(
        eq(readingStates.profileId, LOCAL_OWNER_PROFILE_ID),
        eq(readingStates.watchableId, watchableId),
      ),
    )
    .all()[0];
  if (existing) {
    db.update(readingStates)
      .set({
        readingState,
        openedAt: readingState === 'opened' || readingState === 'read' ? at : existing.openedAt,
        dismissedAt: readingState === 'dismissed' ? at : existing.dismissedAt,
        updatedAt: at,
      })
      .where(eq(readingStates.id, existing.id))
      .run();
    db.insert(readingStateEvents)
      .values({
        id: randomUUID(),
        profileId: LOCAL_OWNER_PROFILE_ID,
        watchableId,
        fromState: existing.readingState,
        toState: readingState,
        createdAt: at,
      })
      .run();
    return existing.id;
  }
  const id = randomUUID();
  db.insert(readingStates)
    .values({
      id,
      profileId: LOCAL_OWNER_PROFILE_ID,
      watchableId,
      readingState,
      personalSurfaceState: 'default',
      openedAt: readingState === 'opened' || readingState === 'read' ? at : null,
      dismissedAt: readingState === 'dismissed' ? at : null,
      updatedAt: at,
    })
    .run();
  db.insert(readingStateEvents)
    .values({
      id: randomUUID(),
      profileId: LOCAL_OWNER_PROFILE_ID,
      watchableId,
      fromState: null,
      toState: readingState,
      createdAt: at,
    })
    .run();
  return id;
}

export function recordVisit(db: HealthspanDb, clientInstallationId?: string) {
  ensureLocalOwnerProfile(db);
  const at = now();
  const id = randomUUID();
  db.insert(visitSessions)
    .values({
      id,
      profileId: LOCAL_OWNER_PROFILE_ID,
      startedAt: at,
      endedAt: null,
      clientInstallationId: clientInstallationId ?? null,
      summaryJson: '{}',
    })
    .run();
  return { id, startedAt: at };
}

export function sinceLastVisit(db: HealthspanDb) {
  ensureLocalOwnerProfile(db);
  const last = db
    .select()
    .from(visitSessions)
    .where(eq(visitSessions.profileId, LOCAL_OWNER_PROFILE_ID))
    .orderBy(desc(visitSessions.startedAt))
    .all()[1]; // previous visit if current just opened
  const window = sinceLastVisitWindow(last?.startedAt ?? null);
  const events = db
    .select()
    .from(changeEvents)
    .all()
    .filter((e) => !e.isBaseline && e.detectedAt >= window.start && e.detectedAt <= window.end)
    .sort((a, b) => b.detectedAt - a.detectedAt)
    .slice(0, 50);
  return { window, items: events };
}

export function createMuteRule(
  db: HealthspanDb,
  scopeType: string,
  scopeId?: string,
  reason?: string,
) {
  ensureLocalOwnerProfile(db);
  const id = randomUUID();
  db.insert(muteRules)
    .values({
      id,
      profileId: LOCAL_OWNER_PROFILE_ID,
      scopeType,
      scopeId: scopeId ?? null,
      reason: reason ?? null,
      active: true,
      createdAt: now(),
      expiresAt: null,
    })
    .run();
  return db.select().from(muteRules).where(eq(muteRules.id, id)).all()[0]!;
}

export function listAlerts(db: HealthspanDb) {
  ensureLocalOwnerProfile(db);
  return db
    .select()
    .from(alerts)
    .where(eq(alerts.profileId, LOCAL_OWNER_PROFILE_ID))
    .orderBy(desc(alerts.createdAt))
    .all()
    .slice(0, 100);
}

export function evaluateDeterministicAlerts(db: HealthspanDb) {
  ensureLocalOwnerProfile(db);
  const at = now();
  const rules = db
    .select()
    .from(alertRules)
    .where(and(eq(alertRules.profileId, LOCAL_OWNER_PROFILE_ID), eq(alertRules.enabled, true)))
    .all();
  const recent = db
    .select()
    .from(changeEvents)
    .all()
    .filter((e) => !e.isBaseline)
    .sort((a, b) => b.detectedAt - a.detectedAt)
    .slice(0, 40);
  let created = 0;
  for (const event of recent) {
    const kind = String(event.kind);
    const applicable =
      rules.length === 0 ||
      rules.some((r) => {
        const kinds = JSON.parse(r.eventKindsJson || '[]') as string[];
        return kinds.length === 0 || kinds.includes(kind);
      });
    if (!applicable) continue;
    const dedupeKey = buildAlertDedupeKey({
      kind,
      eventRef: event.id,
      watchableId: event.contentItemId,
    });
    const existing = db
      .select()
      .from(alerts)
      .where(and(eq(alerts.profileId, LOCAL_OWNER_PROFILE_ID), eq(alerts.dedupeKey, dedupeKey)))
      .all()[0];
    if (existing) continue;
    db.insert(alerts)
      .values({
        id: randomUUID(),
        profileId: LOCAL_OWNER_PROFILE_ID,
        ruleId: rules[0]?.id ?? null,
        kind,
        title: event.title,
        summary: event.summary,
        severityJson: JSON.stringify({ changeEventId: event.id }),
        whyIncludedJson: JSON.stringify({
          reason: 'matched_enabled_alert_rule',
          changeEventId: event.id,
          sourceDetectedAt: event.detectedAt,
          ruleId: rules[0]?.id ?? null,
        }),
        watchableId: null,
        dedupeKey,
        state: 'new',
        importance: event.importance ?? 'medium',
        family: 'research',
        snoozeUntil: null,
        occurredAt: event.occurredAt,
        createdAt: at,
        updatedAt: at,
      })
      .run();
    created += 1;
  }
  return { created, scanned: recent.length };
}

export function generateBrief(db: HealthspanDb, kind: 'daily' | 'weekly') {
  ensureLocalOwnerProfile(db);
  const settings = db
    .select()
    .from(briefingSettings)
    .where(eq(briefingSettings.profileId, LOCAL_OWNER_PROFILE_ID))
    .all()[0];
  const max = kind === 'daily' ? (settings?.maxDailyItems ?? 20) : (settings?.maxWeeklyItems ?? 40);
  const windowMs = kind === 'daily' ? 86400000 : 7 * 86400000;
  const end = now();
  const start = end - windowMs;
  const runId = randomUUID();
  db.insert(briefingRuns)
    .values({
      id: runId,
      profileId: LOCAL_OWNER_PROFILE_ID,
      kind,
      status: 'running',
      windowStart: start,
      windowEnd: end,
      itemCount: 0,
      startedAt: end,
    })
    .run();

  const candidates = db
    .select()
    .from(changeEvents)
    .all()
    .filter((e) => !e.isBaseline && e.detectedAt >= start && e.detectedAt <= end)
    .map((e) => ({
      id: e.id,
      importance: e.importance ?? 'medium',
      occurredAt: e.detectedAt,
      title: e.title,
      summary: e.summary,
    }));
  const selected = selectBriefItems(candidates, max);
  const briefId = randomUUID();
  db.insert(briefs)
    .values({
      id: briefId,
      profileId: LOCAL_OWNER_PROFILE_ID,
      runId,
      kind,
      title: kind === 'daily' ? 'Daily research brief' : 'Weekly review',
      summary: `${selected.length} material changes in window`,
      windowStart: start,
      windowEnd: end,
      createdAt: end,
    })
    .run();
  selected.forEach((item, idx) => {
    db.insert(briefItems)
      .values({
        id: randomUUID(),
        briefId,
        watchableId: null,
        title: item.title,
        summary: item.summary,
        reason: 'material_change_in_window',
        rank: idx + 1,
        payloadJson: JSON.stringify({ changeEventId: item.id }),
      })
      .run();
  });
  db.update(briefingRuns)
    .set({ status: 'succeeded', itemCount: selected.length, completedAt: now() })
    .where(eq(briefingRuns.id, runId))
    .run();
  return { briefId, runId, itemCount: selected.length };
}

export function listBriefs(db: HealthspanDb) {
  ensureLocalOwnerProfile(db);
  return db
    .select()
    .from(briefs)
    .where(eq(briefs.profileId, LOCAL_OWNER_PROFILE_ID))
    .orderBy(desc(briefs.createdAt))
    .all()
    .slice(0, 50);
}

export function importLegacyPreferencesPreview(
  db: HealthspanDb,
  raw: unknown,
  browserIdentityHash: string,
) {
  ensureLocalOwnerProfile(db);
  const preview = previewLegacyPreferenceImport(raw);
  const id = randomUUID();
  db.insert(preferenceMigrationRuns)
    .values({
      id,
      profileId: LOCAL_OWNER_PROFILE_ID,
      browserIdentityHash,
      sourceSchemaVersion: 1,
      previewCount: preview.ok ? preview.importable : 0,
      importedCount: 0,
      skippedCount: preview.ok ? preview.unresolvedDemoBlocked : 0,
      unresolvedCount: preview.ok ? 0 : 1,
      status: preview.ok ? 'previewed' : 'failed',
      errorSummary: preview.ok ? null : preview.error,
      createdAt: now(),
      completedAt: now(),
    })
    .run();
  return { runId: id, preview };
}

export function personalisationExport(db: HealthspanDb) {
  ensureLocalOwnerProfile(db);
  const payload = {
    formatVersion: 1,
    profileId: LOCAL_OWNER_PROFILE_ID,
    exportedAt: new Date().toISOString(),
    watchlists: listWatchlists(db),
    savedSearches: listSavedSearches(db),
    muteRules: db
      .select()
      .from(muteRules)
      .where(eq(muteRules.profileId, LOCAL_OWNER_PROFILE_ID))
      .all(),
    warning:
      'Personalisation export only. No medical records. Demo IDs must not be re-imported into Live.',
  };
  return payload;
}

export function renameWatchlist(db: HealthspanDb, id: string, name: string) {
  ensureLocalOwnerProfile(db);
  const at = now();
  db.update(watchlists)
    .set({ name, slug: slugifyWatchlistName(name), updatedAt: at })
    .where(and(eq(watchlists.id, id), eq(watchlists.profileId, LOCAL_OWNER_PROFILE_ID)))
    .run();
  return db.select().from(watchlists).where(eq(watchlists.id, id)).all()[0] ?? null;
}

export function setWatchlistActive(db: HealthspanDb, id: string, active: boolean) {
  ensureLocalOwnerProfile(db);
  const at = now();
  db.update(watchlists)
    .set({ active, updatedAt: at })
    .where(and(eq(watchlists.id, id), eq(watchlists.profileId, LOCAL_OWNER_PROFILE_ID)))
    .run();
  return db.select().from(watchlists).where(eq(watchlists.id, id)).all()[0] ?? null;
}

export function removeWatchlistItem(db: HealthspanDb, watchlistId: string, watchableId: string) {
  const at = now();
  db.update(watchlistEntries)
    .set({ state: 'removed', removedAt: at })
    .where(
      and(
        eq(watchlistEntries.watchlistId, watchlistId),
        eq(watchlistEntries.watchableId, watchableId),
      ),
    )
    .run();
  return true;
}

export function defaultFollowingWatchlist(db: HealthspanDb) {
  ensureLocalOwnerProfile(db);
  return (
    db
      .select()
      .from(watchlists)
      .where(
        and(
          eq(watchlists.profileId, LOCAL_OWNER_PROFILE_ID),
          eq(watchlists.isDefault, true),
          eq(watchlists.active, true),
        ),
      )
      .all()[0] ?? listWatchlists(db)[0]!
  );
}

export function followTarget(
  db: HealthspanDb,
  target: { targetType: string; targetId: string; displayTitle?: string },
) {
  const following = defaultFollowingWatchlist(db);
  return addWatchlistItem(db, following.id, target);
}

export function unfollowTarget(db: HealthspanDb, targetType: string, targetId: string) {
  const following = defaultFollowingWatchlist(db);
  const watchable = db
    .select()
    .from(watchableObjects)
    .where(
      and(
        eq(watchableObjects.dataOrigin, 'live'),
        eq(watchableObjects.targetType, targetType),
        eq(watchableObjects.targetId, targetId),
      ),
    )
    .all()[0];
  if (!watchable) return false;
  removeWatchlistItem(db, following.id, watchable.id);
  return true;
}

export function isFollowing(db: HealthspanDb, targetType: string, targetId: string) {
  const following = defaultFollowingWatchlist(db);
  const items = listWatchlistItems(db, following.id);
  return items.some(
    (i) => i.watchable?.targetType === targetType && i.watchable?.targetId === targetId,
  );
}

export function updateAlertState(
  db: HealthspanDb,
  alertId: string,
  toState: 'new' | 'unread' | 'read' | 'acknowledged' | 'snoozed' | 'dismissed' | 'resolved',
) {
  ensureLocalOwnerProfile(db);
  const alert = db.select().from(alerts).where(eq(alerts.id, alertId)).all()[0];
  if (!alert) return null;
  const at = now();
  db.update(alerts).set({ state: toState, updatedAt: at }).where(eq(alerts.id, alertId)).run();
  db.insert(alertStateEvents)
    .values({
      id: randomUUID(),
      alertId,
      fromState: alert.state,
      toState,
      createdAt: at,
    })
    .run();
  return db.select().from(alerts).where(eq(alerts.id, alertId)).all()[0]!;
}

export function getAlert(db: HealthspanDb, id: string) {
  return db.select().from(alerts).where(eq(alerts.id, id)).all()[0] ?? null;
}

export function getBrief(db: HealthspanDb, id: string) {
  const brief = db.select().from(briefs).where(eq(briefs.id, id)).all()[0];
  if (!brief) return null;
  const items = db.select().from(briefItems).where(eq(briefItems.briefId, id)).all();
  return { brief, items };
}

export function getSavedSearch(db: HealthspanDb, id: string) {
  return db.select().from(savedSearches).where(eq(savedSearches.id, id)).all()[0] ?? null;
}

export function runSavedSearch(db: HealthspanDb, id: string) {
  const search = getSavedSearch(db, id);
  if (!search) return null;
  const { query, needsUpdate } = migrateSavedSearchQuery(JSON.parse(search.queryJson));
  if (needsUpdate || search.querySchemaVersion < 2) {
    db.update(savedSearches)
      .set({
        queryJson: JSON.stringify(query),
        querySchemaVersion: 2,
        canonicalHash: canonicalSearchHash(query),
        needsUpdate: true,
        updatedAt: now(),
      })
      .where(eq(savedSearches.id, id))
      .run();
  }
  const at = now();
  const events = db.select().from(changeEvents).orderBy(desc(changeEvents.occurredAt)).all();
  const text = (query.textQuery ?? '').toLowerCase();
  const entityTypes = query.entityTypes ?? [];
  const sources = query.filters?.source ?? [];
  let status: 'ok' | 'capped' | 'partial' | 'error' = 'ok';
  let errorSummary: string | null = null;
  let matched: typeof events = [];
  try {
    matched = events.filter((e) => {
      const hay = `${e.title ?? ''} ${e.summary ?? ''} ${e.kind}`.toLowerCase();
      if (text && !hay.includes(text)) return false;
      if (entityTypes.length && !entityTypes.some((t) => e.kind.includes(t))) return false;
      if (sources.length && !sources.some((s) => hay.includes(s.toLowerCase()))) return false;
      if (!query.includeRetracted && hay.includes('retracted')) return false;
      return true;
    });
  } catch (err) {
    status = 'error';
    errorSummary = err instanceof Error ? err.message : 'evaluation failed';
  }
  const capped = matched.length > 100;
  if (capped) status = 'capped';
  const page = matched.slice(0, 100);
  let newCount = 0;
  for (const event of page) {
    const watchable = ensureWatchable(db, {
      dataOrigin: 'live',
      targetType: 'change_event',
      targetId: event.id,
      displayTitle: event.title,
    });
    const existing = db
      .select()
      .from(savedSearchMatches)
      .where(
        and(
          eq(savedSearchMatches.savedSearchId, id),
          eq(savedSearchMatches.watchableId, watchable.id),
        ),
      )
      .all()[0];
    if (existing) {
      db.update(savedSearchMatches)
        .set({ lastMatchedAt: at, matchState: 'current' })
        .where(eq(savedSearchMatches.id, existing.id))
        .run();
    } else {
      newCount += 1;
      db.insert(savedSearchMatches)
        .values({
          id: randomUUID(),
          savedSearchId: id,
          watchableId: watchable.id,
          firstMatchedAt: at,
          lastMatchedAt: at,
          matchState: 'current',
          matchVersion: 1,
        })
        .run();
    }
  }
  const evalId = randomUUID();
  db.insert(savedSearchEvaluations)
    .values({
      id: evalId,
      savedSearchId: id,
      windowStart: at - 7 * 86400000,
      windowEnd: at,
      queryHash: canonicalSearchHash(query),
      status,
      matchedCount: page.length,
      newCount,
      cappedCount: capped ? matched.length - 100 : 0,
      errorSummary,
      startedAt: at,
      completedAt: at,
    })
    .run();
  db.update(savedSearches)
    .set({ updatedAt: at, needsUpdate: false })
    .where(eq(savedSearches.id, id))
    .run();
  return {
    search: getSavedSearch(db, id),
    evaluationId: evalId,
    matches: page,
    status,
    capped,
    newCount,
    errorSummary,
  };
}

export function archiveSavedSearch(db: HealthspanDb, id: string) {
  const at = now();
  db.update(savedSearches)
    .set({ state: 'archived', updatedAt: at })
    .where(eq(savedSearches.id, id))
    .run();
  return getSavedSearch(db, id);
}

export function applyLegacyPreferenceImport(
  db: HealthspanDb,
  raw: unknown,
  browserIdentityHash: string,
) {
  const previewed = importLegacyPreferencesPreview(db, raw, browserIdentityHash);
  if (!previewed.preview.ok) return previewed;
  const following = defaultFollowingWatchlist(db);
  const ids =
    (raw as { followedIdsByMode?: { live?: string[] }; followedIds?: string[] }).followedIdsByMode
      ?.live ??
    (raw as { followedIds?: string[] }).followedIds ??
    [];
  let imported = 0;
  for (const targetId of ids) {
    if (String(targetId).startsWith('demo-')) continue;
    addWatchlistItem(db, following.id, {
      targetType: 'content_item',
      targetId: String(targetId),
      displayTitle: String(targetId),
    });
    imported += 1;
  }
  db.update(preferenceMigrationRuns)
    .set({ importedCount: imported, status: 'completed', completedAt: now() })
    .where(eq(preferenceMigrationRuns.id, previewed.runId))
    .run();
  return { ...previewed, imported };
}

export function getBriefingSettings(db: HealthspanDb) {
  ensureLocalOwnerProfile(db);
  return db
    .select()
    .from(briefingSettings)
    .where(eq(briefingSettings.profileId, LOCAL_OWNER_PROFILE_ID))
    .all()[0]!;
}

export function updateBriefingSettings(
  db: HealthspanDb,
  patch: {
    dailyEnabled?: boolean;
    weeklyEnabled?: boolean;
    maxDailyItems?: number;
    maxWeeklyItems?: number;
  },
) {
  const current = getBriefingSettings(db);
  const at = now();
  db.update(briefingSettings)
    .set({
      dailyEnabled: patch.dailyEnabled ?? current.dailyEnabled,
      weeklyEnabled: patch.weeklyEnabled ?? current.weeklyEnabled,
      maxDailyItems: patch.maxDailyItems ?? current.maxDailyItems,
      maxWeeklyItems: patch.maxWeeklyItems ?? current.maxWeeklyItems,
      updatedAt: at,
    })
    .where(eq(briefingSettings.id, current.id))
    .run();
  return getBriefingSettings(db);
}

export function fingerprint(value: string) {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}
