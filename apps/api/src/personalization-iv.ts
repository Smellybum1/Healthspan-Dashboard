/**
 * Remediation IV personalisation workflows — extends personalization-service.ts.
 */
import { randomUUID } from 'node:crypto';
import { and, desc, eq, isNull } from 'drizzle-orm';
import {
  AlertRuleSchema,
  BATCH_LIMIT,
  LOCAL_OWNER_PROFILE_ID,
  MuteScopeTypeSchema,
  ReadingStateSchema,
  PersonalSurfaceStateSchema,
  migrateSavedSearchQuery,
  canonicalSearchHash,
  selectBriefItems,
  sinceLastVisitWindow,
  slugifyWatchlistName,
  type AlertRuleInput,
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
  muteRules,
  personalisationImportsExports,
  preferenceMigrationRuns,
  profilePreferences,
  readingStateEvents,
  readingStates,
  savedSearches,
  savedSearchEvaluations,
  savedSearchMatches,
  visitSessions,
  watchableObjects,
  watchlistEntries,
  watchlists,
  type HealthspanDb,
} from '@healthspan/db';
import {
  createMuteRule,
  createSavedSearch,
  createWatchlist,
  ensureLocalOwnerProfile,
  ensureWatchable,
  getAlert,
  getBrief,
  getBriefingSettings,
  getSavedSearch,
  listAlerts,
  listBriefs,
  listSavedSearches,
  listWatchlistItems,
  personalisationExport,
  removeWatchlistItem,
  runSavedSearch,
  updateAlertState,
} from './personalization-service.js';

function now() {
  return Date.now();
}

const INACTIVITY_MS = 30 * 60_000;

type Reading = 'unread' | 'opened' | 'read' | 'dismissed';
type Surface = 'default' | 'archived' | 'dismissed';

export function listAllWatchlists(db: HealthspanDb, opts?: { includeArchived?: boolean }) {
  ensureLocalOwnerProfile(db);
  const rows = db
    .select()
    .from(watchlists)
    .where(eq(watchlists.profileId, LOCAL_OWNER_PROFILE_ID))
    .all();
  return rows.filter((w) => {
    if (w.deletedAt) return false;
    if (!opts?.includeArchived && !w.active) return false;
    return true;
  });
}

export function getWatchlist(db: HealthspanDb, id: string) {
  ensureLocalOwnerProfile(db);
  return (
    db
      .select()
      .from(watchlists)
      .where(
        and(
          eq(watchlists.id, id),
          eq(watchlists.profileId, LOCAL_OWNER_PROFILE_ID),
          isNull(watchlists.deletedAt),
        ),
      )
      .all()[0] ?? null
  );
}

function getWatchlistIncludingDeleted(db: HealthspanDb, id: string) {
  return db.select().from(watchlists).where(eq(watchlists.id, id)).all()[0] ?? null;
}

export function deleteWatchlist(db: HealthspanDb, id: string) {
  ensureLocalOwnerProfile(db);
  const wl = getWatchlistIncludingDeleted(db, id);
  if (!wl || wl.profileId !== LOCAL_OWNER_PROFILE_ID) return null;
  if (wl.isDefault) throw new Error('Cannot delete the default Following watchlist');
  const at = now();
  db.update(watchlists)
    .set({ active: false, deletedAt: at, updatedAt: at })
    .where(eq(watchlists.id, id))
    .run();
  return getWatchlistIncludingDeleted(db, id);
}

export function restoreWatchlist(db: HealthspanDb, id: string) {
  ensureLocalOwnerProfile(db);
  const at = now();
  db.update(watchlists)
    .set({ active: true, deletedAt: null, updatedAt: at })
    .where(and(eq(watchlists.id, id), eq(watchlists.profileId, LOCAL_OWNER_PROFILE_ID)))
    .run();
  return getWatchlist(db, id);
}

export function updateWatchlistSettings(
  db: HealthspanDb,
  id: string,
  patch: {
    name?: string;
    active?: boolean;
    alertEnabled?: boolean;
    briefEnabled?: boolean;
  },
) {
  ensureLocalOwnerProfile(db);
  const current = getWatchlistIncludingDeleted(db, id);
  if (!current || current.profileId !== LOCAL_OWNER_PROFILE_ID) return null;
  const at = now();
  db.update(watchlists)
    .set({
      name: patch.name?.trim() || current.name,
      slug: patch.name?.trim() ? slugifyWatchlistName(patch.name) : current.slug,
      active: typeof patch.active === 'boolean' ? patch.active : current.active,
      alertEnabled:
        typeof patch.alertEnabled === 'boolean' ? patch.alertEnabled : current.alertEnabled,
      briefEnabled:
        typeof patch.briefEnabled === 'boolean' ? patch.briefEnabled : current.briefEnabled,
      deletedAt: patch.active === true ? null : current.deletedAt,
      updatedAt: at,
    })
    .where(eq(watchlists.id, id))
    .run();
  return getWatchlistIncludingDeleted(db, id);
}

export function batchWatchlistItems(
  db: HealthspanDb,
  watchlistId: string,
  actions: Array<{
    op: 'add' | 'remove';
    targetType?: string;
    targetId?: string;
    watchableId?: string;
    displayTitle?: string;
  }>,
) {
  if (actions.length > BATCH_LIMIT) throw new Error(`Batch limited to ${BATCH_LIMIT}`);
  const results: Array<{ op: string; ok: boolean; watchableId?: string }> = [];
  for (const action of actions) {
    if (action.op === 'add') {
      if (!action.targetType || !action.targetId) {
        results.push({ op: 'add', ok: false });
        continue;
      }
      const watchable = ensureWatchable(db, {
        dataOrigin: 'live',
        targetType: action.targetType,
        targetId: action.targetId,
        displayTitle: action.displayTitle,
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
      results.push({ op: 'add', ok: true, watchableId: watchable.id });
    } else {
      const wid = action.watchableId;
      if (!wid) {
        results.push({ op: 'remove', ok: false });
        continue;
      }
      removeWatchlistItem(db, watchlistId, wid);
      results.push({ op: 'remove', ok: true, watchableId: wid });
    }
  }
  return { results, count: results.length };
}

function enrichWatchableState<T extends { targetId: string; canonicalUrl?: string | null }>(w: T) {
  const availability = w.targetId.startsWith('unavailable-')
    ? 'unavailable'
    : w.targetId.startsWith('redirected-')
      ? 'redirected'
      : 'available';
  const redirectedTo =
    availability === 'redirected'
      ? w.canonicalUrl || w.targetId.replace(/^redirected-/, '') || null
      : null;
  return { ...w, availability, redirectedTo };
}

export function listWatchlistChanges(
  db: HealthspanDb,
  watchlistId: string,
  optsOrLimit?: number | { limit?: number; page?: number; pageSize?: number },
) {
  const opts = typeof optsOrLimit === 'number' ? { limit: optsOrLimit } : (optsOrLimit ?? {});
  const pageSize = Math.min(Math.max(opts.pageSize ?? opts.limit ?? 50, 1), 200);
  const page = Math.max(opts.page ?? 1, 1);
  const entries = db
    .select()
    .from(watchlistEntries)
    .where(eq(watchlistEntries.watchlistId, watchlistId))
    .orderBy(desc(watchlistEntries.addedAt))
    .all();
  const total = entries.length;
  const start = (page - 1) * pageSize;
  const pageEntries = entries.slice(start, start + pageSize);
  const items = pageEntries.map((e) => {
    const w = db
      .select()
      .from(watchableObjects)
      .where(eq(watchableObjects.id, e.watchableId))
      .all()[0];
    return {
      ...e,
      watchable: w ? enrichWatchableState(w) : null,
    };
  });
  return { items, total, page, pageSize };
}

export function listWatchlistItemsFiltered(
  db: HealthspanDb,
  watchlistId: string,
  opts?: { targetType?: string; page?: number; pageSize?: number },
) {
  const pageSize = Math.min(Math.max(opts?.pageSize ?? 50, 1), 200);
  const page = Math.max(opts?.page ?? 1, 1);
  let items = listWatchlistItems(db, watchlistId).map((e) => ({
    ...e,
    watchable: e.watchable ? enrichWatchableState(e.watchable) : null,
  }));
  if (opts?.targetType) {
    items = items.filter((i) => i.watchable?.targetType === opts.targetType);
  }
  const total = items.length;
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total, page, pageSize };
}

export function updateSavedSearch(
  db: HealthspanDb,
  id: string,
  patch: {
    name?: string;
    query?: unknown;
    alertEnabled?: boolean;
    briefEnabled?: boolean;
    state?: 'active' | 'archived';
    needsUpdate?: boolean;
  },
) {
  const current = getSavedSearch(db, id);
  if (!current) return null;
  const at = now();
  let queryJson = current.queryJson;
  let hash = current.canonicalHash;
  let querySchemaVersion = current.querySchemaVersion;
  let needsUpdate = current.needsUpdate;
  if (patch.query !== undefined) {
    const migrated = migrateSavedSearchQuery(patch.query);
    queryJson = JSON.stringify(migrated.query);
    hash = canonicalSearchHash(migrated.query);
    querySchemaVersion = 2;
    needsUpdate = migrated.needsUpdate;
  }
  if (typeof patch.needsUpdate === 'boolean') {
    needsUpdate = patch.needsUpdate;
  }
  db.update(savedSearches)
    .set({
      name: patch.name?.trim() || current.name,
      queryJson,
      canonicalHash: hash,
      querySchemaVersion,
      needsUpdate: Boolean(needsUpdate),
      alertEnabled:
        typeof patch.alertEnabled === 'boolean' ? patch.alertEnabled : current.alertEnabled,
      briefEnabled:
        typeof patch.briefEnabled === 'boolean' ? patch.briefEnabled : current.briefEnabled,
      state: patch.state ?? current.state,
      updatedAt: at,
    })
    .where(eq(savedSearches.id, id))
    .run();
  return getSavedSearch(db, id);
}

export function deleteSavedSearch(db: HealthspanDb, id: string) {
  const at = now();
  db.update(savedSearches)
    .set({ state: 'deleted', updatedAt: at })
    .where(eq(savedSearches.id, id))
    .run();
  return getSavedSearch(db, id);
}

export function restoreSavedSearch(db: HealthspanDb, id: string) {
  return updateSavedSearch(db, id, { state: 'active' });
}

export function listSavedSearchMatches(db: HealthspanDb, id: string) {
  return db
    .select()
    .from(savedSearchMatches)
    .where(eq(savedSearchMatches.savedSearchId, id))
    .orderBy(desc(savedSearchMatches.lastMatchedAt))
    .all()
    .slice(0, 200);
}

export function listSavedSearchHistory(db: HealthspanDb, id: string) {
  return db
    .select()
    .from(savedSearchEvaluations)
    .where(eq(savedSearchEvaluations.savedSearchId, id))
    .orderBy(desc(savedSearchEvaluations.startedAt))
    .all()
    .slice(0, 50);
}

export function runSavedSearchPersisted(db: HealthspanDb, id: string) {
  return runSavedSearch(db, id);
}

export function listReadingStates(db: HealthspanDb, opts?: { watchableId?: string }) {
  ensureLocalOwnerProfile(db);
  if (opts?.watchableId) {
    return db
      .select()
      .from(readingStates)
      .where(
        and(
          eq(readingStates.profileId, LOCAL_OWNER_PROFILE_ID),
          eq(readingStates.watchableId, opts.watchableId),
        ),
      )
      .all();
  }
  return db
    .select()
    .from(readingStates)
    .where(eq(readingStates.profileId, LOCAL_OWNER_PROFILE_ID))
    .orderBy(desc(readingStates.updatedAt))
    .all()
    .slice(0, 200);
}

export function putReadingState(
  db: HealthspanDb,
  watchableId: string,
  patch: { readingState?: Reading; personalSurfaceState?: Surface },
) {
  ensureLocalOwnerProfile(db);
  const readingState = patch.readingState
    ? ReadingStateSchema.parse(patch.readingState)
    : undefined;
  const surface = patch.personalSurfaceState
    ? PersonalSurfaceStateSchema.parse(patch.personalSurfaceState)
    : undefined;
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
    const toState = readingState ?? existing.readingState;
    db.update(readingStates)
      .set({
        readingState: toState,
        personalSurfaceState: surface ?? existing.personalSurfaceState,
        openedAt: toState === 'opened' || toState === 'read' ? at : existing.openedAt,
        dismissedAt: toState === 'dismissed' || surface === 'dismissed' ? at : existing.dismissedAt,
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
        toState,
        createdAt: at,
      })
      .run();
    return listReadingStates(db, { watchableId })[0]!;
  }
  const id = randomUUID();
  const toState = readingState ?? 'unread';
  db.insert(readingStates)
    .values({
      id,
      profileId: LOCAL_OWNER_PROFILE_ID,
      watchableId,
      readingState: toState,
      personalSurfaceState: surface ?? 'default',
      openedAt: toState === 'opened' || toState === 'read' ? at : null,
      dismissedAt: toState === 'dismissed' || surface === 'dismissed' ? at : null,
      updatedAt: at,
    })
    .run();
  db.insert(readingStateEvents)
    .values({
      id: randomUUID(),
      profileId: LOCAL_OWNER_PROFILE_ID,
      watchableId,
      fromState: null,
      toState,
      createdAt: at,
    })
    .run();
  return listReadingStates(db, { watchableId })[0]!;
}

export function batchReadingState(
  db: HealthspanDb,
  actions: Array<{
    watchableId: string;
    readingState?: Reading;
    personalSurfaceState?: Surface;
  }>,
) {
  if (actions.length > BATCH_LIMIT) throw new Error(`Batch limited to ${BATCH_LIMIT}`);
  return actions.map((a) => putReadingState(db, a.watchableId, a));
}

export function listMutes(db: HealthspanDb) {
  ensureLocalOwnerProfile(db);
  const at = now();
  const rows = db
    .select()
    .from(muteRules)
    .where(eq(muteRules.profileId, LOCAL_OWNER_PROFILE_ID))
    .orderBy(desc(muteRules.createdAt))
    .all();
  for (const row of rows) {
    if (row.active && row.expiresAt && row.expiresAt <= at) {
      db.update(muteRules).set({ active: false }).where(eq(muteRules.id, row.id)).run();
      row.active = false;
    }
  }
  return rows;
}

export function createMute(
  db: HealthspanDb,
  input: {
    scopeType: string;
    scopeId?: string;
    scopeEventType?: string;
    reason?: string;
    expiresAt?: number | null;
  },
) {
  const normalised = input.scopeType === 'watchable' ? 'object' : input.scopeType;
  MuteScopeTypeSchema.parse(normalised);
  ensureLocalOwnerProfile(db);
  const id = randomUUID();
  db.insert(muteRules)
    .values({
      id,
      profileId: LOCAL_OWNER_PROFILE_ID,
      scopeType: normalised,
      scopeId: input.scopeId ?? null,
      scopeEventType: input.scopeEventType ?? null,
      reason: input.reason ?? null,
      active: true,
      createdAt: now(),
      expiresAt: input.expiresAt ?? null,
    })
    .run();
  return db.select().from(muteRules).where(eq(muteRules.id, id)).all()[0]!;
}

export function updateMute(
  db: HealthspanDb,
  id: string,
  patch: { active?: boolean; reason?: string; expiresAt?: number | null; scopeEventType?: string },
) {
  const current = db.select().from(muteRules).where(eq(muteRules.id, id)).all()[0];
  if (!current) return null;
  db.update(muteRules)
    .set({
      active: typeof patch.active === 'boolean' ? patch.active : current.active,
      reason: patch.reason ?? current.reason,
      expiresAt: patch.expiresAt === undefined ? current.expiresAt : patch.expiresAt,
      scopeEventType: patch.scopeEventType ?? current.scopeEventType,
    })
    .where(eq(muteRules.id, id))
    .run();
  return db.select().from(muteRules).where(eq(muteRules.id, id)).all()[0]!;
}

export function deleteMute(db: HealthspanDb, id: string) {
  db.update(muteRules).set({ active: false }).where(eq(muteRules.id, id)).run();
  return db.select().from(muteRules).where(eq(muteRules.id, id)).all()[0] ?? null;
}

export function startVisit(
  db: HealthspanDb,
  input: { clientInstallationId?: string; tabSessionId?: string } = {},
) {
  ensureLocalOwnerProfile(db);
  const at = now();
  coalesceStaleVisits(db, at);
  const previous = getPreviousVisit(db);
  const id = randomUUID();
  const cutoff = previous?.endedAt ?? previous?.startedAt ?? null;
  db.insert(visitSessions)
    .values({
      id,
      profileId: LOCAL_OWNER_PROFILE_ID,
      startedAt: at,
      endedAt: null,
      clientInstallationId: input.clientInstallationId ?? null,
      tabSessionId: input.tabSessionId ?? null,
      lastHeartbeatAt: at,
      status: 'open',
      previousCutoffAt: cutoff,
      summaryJson: JSON.stringify({ firstVisit: !previous }),
    })
    .run();
  return {
    id,
    startedAt: at,
    previousCutoffAt: cutoff,
    firstVisit: !previous,
    previousVisit: previous,
  };
}

function coalesceStaleVisits(db: HealthspanDb, at: number) {
  const open = db
    .select()
    .from(visitSessions)
    .where(
      and(eq(visitSessions.profileId, LOCAL_OWNER_PROFILE_ID), eq(visitSessions.status, 'open')),
    )
    .all();
  for (const v of open) {
    const last = v.lastHeartbeatAt ?? v.startedAt;
    if (at - last > INACTIVITY_MS) {
      db.update(visitSessions)
        .set({ status: 'coalesced', endedAt: last })
        .where(eq(visitSessions.id, v.id))
        .run();
    }
  }
}

export function heartbeatVisit(db: HealthspanDb, id: string) {
  const visit = db.select().from(visitSessions).where(eq(visitSessions.id, id)).all()[0];
  if (!visit || visit.status !== 'open') return null;
  const at = now();
  db.update(visitSessions).set({ lastHeartbeatAt: at }).where(eq(visitSessions.id, id)).run();
  return { id, lastHeartbeatAt: at };
}

export function closeVisit(db: HealthspanDb, id: string) {
  const visit = db.select().from(visitSessions).where(eq(visitSessions.id, id)).all()[0];
  if (!visit) return null;
  const at = now();
  db.update(visitSessions)
    .set({ status: 'closed', endedAt: at, lastHeartbeatAt: at })
    .where(eq(visitSessions.id, id))
    .run();
  return db.select().from(visitSessions).where(eq(visitSessions.id, id)).all()[0]!;
}

export function getPreviousVisit(db: HealthspanDb) {
  ensureLocalOwnerProfile(db);
  const rows = db
    .select()
    .from(visitSessions)
    .where(eq(visitSessions.profileId, LOCAL_OWNER_PROFILE_ID))
    .orderBy(desc(visitSessions.startedAt))
    .all();
  return (
    rows.find((v) => v.status === 'closed' || v.status === 'coalesced') ??
    rows.find((v) => v.endedAt != null) ??
    null
  );
}

export function sinceLastVisitStable(db: HealthspanDb) {
  ensureLocalOwnerProfile(db);
  const open = db
    .select()
    .from(visitSessions)
    .where(
      and(eq(visitSessions.profileId, LOCAL_OWNER_PROFILE_ID), eq(visitSessions.status, 'open')),
    )
    .orderBy(desc(visitSessions.startedAt))
    .all()[0];
  const previous = getPreviousVisit(db);
  const cutoff = open?.previousCutoffAt ?? previous?.endedAt ?? previous?.startedAt ?? null;
  const window = sinceLastVisitWindow(cutoff);
  const events = db
    .select()
    .from(changeEvents)
    .all()
    .filter((e) => !e.isBaseline && e.detectedAt >= window.start && e.detectedAt <= window.end)
    .sort((a, b) => b.detectedAt - a.detectedAt)
    .slice(0, 50);
  return {
    window,
    items: events,
    previousVisitAt: cutoff,
    firstVisit: !previous && !open,
    activeVisitId: open?.id ?? null,
  };
}

export function listAlertRules(db: HealthspanDb) {
  ensureLocalOwnerProfile(db);
  return db
    .select()
    .from(alertRules)
    .where(eq(alertRules.profileId, LOCAL_OWNER_PROFILE_ID))
    .orderBy(desc(alertRules.updatedAt))
    .all();
}

export function createAlertRule(db: HealthspanDb, raw: unknown) {
  ensureLocalOwnerProfile(db);
  const input = AlertRuleSchema.parse(raw) as AlertRuleInput;
  const at = now();
  const id = randomUUID();
  db.insert(alertRules)
    .values({
      id,
      profileId: LOCAL_OWNER_PROFILE_ID,
      name: input.name,
      enabled: input.enabled,
      targetType: input.targetType,
      targetRef: input.targetRef ?? null,
      eventKindsJson: JSON.stringify(input.eventKinds),
      severityJson: JSON.stringify({
        ...input.severity,
        family: input.family,
        priorityFloor: input.priorityFloor,
      }),
      createdAt: at,
      updatedAt: at,
    })
    .run();
  return db.select().from(alertRules).where(eq(alertRules.id, id)).all()[0]!;
}

export function updateAlertRule(db: HealthspanDb, id: string, raw: unknown) {
  const current = db.select().from(alertRules).where(eq(alertRules.id, id)).all()[0];
  if (!current) return null;
  const partial = AlertRuleSchema.partial().parse(raw);
  const at = now();
  const prevSev = JSON.parse(current.severityJson || '{}') as Record<string, unknown>;
  const severity = {
    ...prevSev,
    ...(partial.severity ?? {}),
    family: partial.family ?? prevSev.family ?? 'research',
    priorityFloor: partial.priorityFloor ?? prevSev.priorityFloor ?? 'medium',
  };
  db.update(alertRules)
    .set({
      name: partial.name ?? current.name,
      enabled: typeof partial.enabled === 'boolean' ? partial.enabled : current.enabled,
      targetType: partial.targetType ?? current.targetType,
      targetRef: partial.targetRef === undefined ? current.targetRef : partial.targetRef,
      eventKindsJson: partial.eventKinds
        ? JSON.stringify(partial.eventKinds)
        : current.eventKindsJson,
      severityJson: JSON.stringify(severity),
      updatedAt: at,
    })
    .where(eq(alertRules.id, id))
    .run();
  return db.select().from(alertRules).where(eq(alertRules.id, id)).all()[0]!;
}

export function deleteAlertRule(db: HealthspanDb, id: string) {
  db.update(alertRules)
    .set({ enabled: false, updatedAt: now() })
    .where(eq(alertRules.id, id))
    .run();
  return db.select().from(alertRules).where(eq(alertRules.id, id)).all()[0] ?? null;
}

export function typedAlertAction(
  db: HealthspanDb,
  alertId: string,
  action: 'read' | 'acknowledge' | 'snooze' | 'dismiss' | 'resolve',
  payload?: { snoozeUntil?: number },
) {
  const map = {
    read: 'read',
    acknowledge: 'acknowledged',
    snooze: 'snoozed',
    dismiss: 'dismissed',
    resolve: 'resolved',
  } as const;
  const item = updateAlertState(db, alertId, map[action]);
  if (!item) return null;
  if (action === 'snooze') {
    const until = payload?.snoozeUntil ?? now() + 4 * 3600_000;
    db.update(alerts)
      .set({ snoozeUntil: until, updatedAt: now() })
      .where(eq(alerts.id, alertId))
      .run();
  }
  const full = getAlert(db, alertId)!;
  return { ...full, whyIncluded: JSON.parse(full.whyIncludedJson || '{}') };
}

export function batchAlertActions(
  db: HealthspanDb,
  actions: Array<{
    alertId: string;
    action: 'read' | 'acknowledge' | 'snooze' | 'dismiss' | 'resolve';
    snoozeUntil?: number;
  }>,
) {
  if (actions.length > BATCH_LIMIT) throw new Error(`Batch limited to ${BATCH_LIMIT}`);
  return actions.map((a) =>
    typedAlertAction(db, a.alertId, a.action, { snoozeUntil: a.snoozeUntil }),
  );
}

export function enrichAlert(db: HealthspanDb, id: string) {
  const item = getAlert(db, id);
  if (!item) return null;
  const history = db
    .select()
    .from(alertStateEvents)
    .where(eq(alertStateEvents.alertId, id))
    .orderBy(desc(alertStateEvents.createdAt))
    .all();
  return {
    item: {
      ...item,
      whyIncluded: JSON.parse(item.whyIncludedJson || '{}'),
      severity: JSON.parse(item.severityJson || '{}'),
    },
    history,
  };
}

export function listAlertsFiltered(
  db: HealthspanDb,
  opts?: {
    state?: string;
    family?: string;
    priority?: string;
    source?: string;
    eventKind?: string;
    watchlistId?: string;
    savedSearchId?: string;
    page?: number;
    pageSize?: number;
  },
) {
  let items = listAlerts(db).map((a) => ({
    ...a,
    whyIncluded: JSON.parse(a.whyIncludedJson || '{}') as Record<string, unknown>,
    severity: JSON.parse(a.severityJson || '{}') as Record<string, unknown>,
  }));
  if (opts?.state) items = items.filter((a) => a.state === opts.state);
  if (opts?.family) items = items.filter((a) => a.family === opts.family);
  if (opts?.priority) items = items.filter((a) => a.importance === opts.priority);
  if (opts?.eventKind)
    items = items.filter((a) => a.kind === opts.eventKind || a.kind.includes(opts.eventKind!));
  if (opts?.source) {
    items = items.filter((a) => {
      const why = a.whyIncluded;
      const src = String(why.source ?? why.sourceId ?? why.sourceName ?? '');
      return src === opts.source || a.kind.includes(opts.source!);
    });
  }
  if (opts?.watchlistId) {
    items = items.filter((a) => {
      const why = a.whyIncluded;
      return (
        String(why.watchlistId ?? why.watchlist ?? '') === opts.watchlistId ||
        a.dedupeKey.includes(opts.watchlistId!)
      );
    });
  }
  if (opts?.savedSearchId) {
    items = items.filter((a) => {
      const why = a.whyIncluded;
      return (
        String(why.savedSearchId ?? why.savedSearch ?? '') === opts.savedSearchId ||
        a.dedupeKey.includes(opts.savedSearchId!)
      );
    });
  }
  const pageSize = Math.min(Math.max(opts?.pageSize ?? 50, 1), 200);
  const page = Math.max(opts?.page ?? 1, 1);
  const total = items.length;
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total, page, pageSize };
}

export function runBrief(db: HealthspanDb, kind: 'daily' | 'weekly' | 'manual_brief' = 'daily') {
  ensureLocalOwnerProfile(db);
  const settings = getBriefingSettings(db);
  const briefKind = kind === 'manual_brief' ? 'manual_brief' : kind;
  const max =
    briefKind === 'weekly' ? (settings.maxWeeklyItems ?? 40) : (settings.maxDailyItems ?? 20);
  const windowMs = briefKind === 'weekly' ? 7 * 86400000 : 86400000;
  const end = now();
  const start = end - windowMs;
  const runId = randomUUID();
  db.insert(briefingRuns)
    .values({
      id: runId,
      profileId: LOCAL_OWNER_PROFILE_ID,
      kind: briefKind,
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
      kind: e.kind,
    }));
  const selected = selectBriefItems(candidates, max);
  const overflow = Math.max(0, candidates.length - selected.length);
  const sources = [...new Set(candidates.map((c) => String(c.kind).split(':')[0] || 'unknown'))];
  const coverage = {
    sourcesSeen: sources,
    candidateCount: candidates.length,
    selectedCount: selected.length,
    overflow,
    partialReasons: candidates.length === 0 ? ['no_material_changes_in_window'] : [],
  };
  const briefId = randomUUID();
  const title =
    briefKind === 'weekly'
      ? 'Weekly review'
      : briefKind === 'manual_brief'
        ? 'Manual brief'
        : 'Daily research brief';
  db.insert(briefs)
    .values({
      id: briefId,
      profileId: LOCAL_OWNER_PROFILE_ID,
      runId,
      kind: briefKind === 'manual_brief' ? 'manual' : briefKind,
      title,
      summary: `${selected.length} material changes in window`,
      windowStart: start,
      windowEnd: end,
      sourceCoverageJson: JSON.stringify(coverage),
      overflowCount: overflow,
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
        readingState: 'unread',
        payloadJson: JSON.stringify({ changeEventId: item.id, whyIncluded: 'in_window_material' }),
      })
      .run();
  });
  db.update(briefingRuns)
    .set({ status: 'succeeded', itemCount: selected.length, completedAt: now() })
    .where(eq(briefingRuns.id, runId))
    .run();
  return { briefId, runId, itemCount: selected.length, coverage, overflow };
}

export function exportBrief(
  db: HealthspanDb,
  id: string,
  format: 'markdown' | 'json' = 'markdown',
) {
  const data = getBrief(db, id);
  if (!data) return null;
  const coverage = JSON.parse(data.brief.sourceCoverageJson || '{}');
  if (format === 'json') {
    return {
      format: 'json' as const,
      filename: `brief-${id}.json`,
      body: JSON.stringify({ ...data, coverage }, null, 2),
    };
  }
  const lines = [
    `# ${data.brief.title}`,
    '',
    data.brief.summary ?? '',
    '',
    `Window: ${new Date(data.brief.windowStart).toISOString()} → ${new Date(data.brief.windowEnd).toISOString()}`,
    '',
    '## Items',
    ...data.items.map(
      (it, i) => `${i + 1}. **${it.title}** — ${it.summary ?? ''} _(why: ${it.reason})_`,
    ),
    '',
    '## Source coverage',
    '```json',
    JSON.stringify(coverage, null, 2),
    '```',
  ];
  return { format: 'markdown' as const, filename: `brief-${id}.md`, body: lines.join('\n') };
}

export function briefingStatus(db: HealthspanDb) {
  const settings = getBriefingSettings(db);
  const runs = db
    .select()
    .from(briefingRuns)
    .where(eq(briefingRuns.profileId, LOCAL_OWNER_PROFILE_ID))
    .orderBy(desc(briefingRuns.startedAt))
    .all()
    .slice(0, 20);
  const lastDaily = runs.find((r) => r.kind === 'daily' && r.status === 'succeeded');
  const lastWeekly = runs.find((r) => r.kind === 'weekly' && r.status === 'succeeded');
  return {
    settings,
    schedule: {
      timezone: settings.timezone,
      daily: { enabled: settings.dailyEnabled, timeLocal: settings.dailyTimeLocal ?? '07:15' },
      weekly: {
        enabled: settings.weeklyEnabled,
        timeLocal: settings.weeklyTimeLocal ?? '09:00',
        weekday: settings.weeklyWeekday ?? 0,
      },
    },
    lastDailyRun: lastDaily ?? null,
    lastWeeklyRun: lastWeekly ?? null,
    recentRuns: runs,
    catchUpPolicy: 'at_most_one_missed_per_kind_on_startup',
  };
}

export function updateBriefingSettingsFull(
  db: HealthspanDb,
  patch: {
    dailyEnabled?: boolean;
    weeklyEnabled?: boolean;
    maxDailyItems?: number;
    maxWeeklyItems?: number;
    timezone?: string;
    dailyTimeLocal?: string;
    weeklyTimeLocal?: string;
    weeklyWeekday?: number;
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
      timezone: patch.timezone ?? current.timezone,
      dailyTimeLocal: patch.dailyTimeLocal ?? current.dailyTimeLocal,
      weeklyTimeLocal: patch.weeklyTimeLocal ?? current.weeklyTimeLocal,
      weeklyWeekday: patch.weeklyWeekday ?? current.weeklyWeekday,
      updatedAt: at,
    })
    .where(eq(briefingSettings.id, current.id))
    .run();
  return getBriefingSettings(db);
}

export function updateBriefItemReading(
  db: HealthspanDb,
  briefId: string,
  itemId: string,
  readingState: Reading,
) {
  db.update(briefItems)
    .set({ readingState })
    .where(and(eq(briefItems.id, itemId), eq(briefItems.briefId, briefId)))
    .run();
  return getBrief(db, briefId);
}

export function getProfilePreference(db: HealthspanDb, key: string) {
  ensureLocalOwnerProfile(db);
  return (
    db
      .select()
      .from(profilePreferences)
      .where(
        and(
          eq(profilePreferences.profileId, LOCAL_OWNER_PROFILE_ID),
          eq(profilePreferences.preferenceKey, key),
        ),
      )
      .all()[0] ?? null
  );
}

export function setProfilePreference(db: HealthspanDb, key: string, value: unknown) {
  ensureLocalOwnerProfile(db);
  const existing = getProfilePreference(db, key);
  const at = now();
  if (existing) {
    db.update(profilePreferences)
      .set({ valueJson: JSON.stringify(value), updatedAt: at, source: 'user' })
      .where(eq(profilePreferences.id, existing.id))
      .run();
  } else {
    db.insert(profilePreferences)
      .values({
        id: randomUUID(),
        profileId: LOCAL_OWNER_PROFILE_ID,
        preferenceKey: key,
        valueJson: JSON.stringify(value),
        valueVersion: 1,
        source: 'user',
        updatedAt: at,
      })
      .run();
  }
  return getProfilePreference(db, key);
}

export function migrationStatus(db: HealthspanDb) {
  ensureLocalOwnerProfile(db);
  const runs = db
    .select()
    .from(preferenceMigrationRuns)
    .where(eq(preferenceMigrationRuns.profileId, LOCAL_OWNER_PROFILE_ID))
    .orderBy(desc(preferenceMigrationRuns.createdAt))
    .all()
    .slice(0, 10);
  const completed = runs.find((r) => r.status === 'completed' || r.status === 'skipped');
  return {
    completed: Boolean(completed),
    lastRun: runs[0] ?? null,
    runs,
    knownLegacyKeys: [
      'healthspan.preferences',
      'healthspan.prefs',
      'healthspan.followed',
      'healthspan.followedIds',
      'healthspan.theme',
      'healthspan.browserNotifications',
    ],
  };
}

export function skipMigration(db: HealthspanDb, browserIdentityHash = 'unknown') {
  ensureLocalOwnerProfile(db);
  const id = randomUUID();
  db.insert(preferenceMigrationRuns)
    .values({
      id,
      profileId: LOCAL_OWNER_PROFILE_ID,
      browserIdentityHash,
      sourceSchemaVersion: 1,
      previewCount: 0,
      importedCount: 0,
      skippedCount: 1,
      unresolvedCount: 0,
      status: 'skipped',
      createdAt: now(),
      completedAt: now(),
    })
    .run();
  return migrationStatus(db);
}

export function personalisationExportFull(db: HealthspanDb) {
  ensureLocalOwnerProfile(db);
  const base = personalisationExport(db);
  const payload = {
    ...base,
    formatVersion: 2,
    alertRules: listAlertRules(db),
    briefingSettings: getBriefingSettings(db),
    readingStates: listReadingStates(db),
    watchlistEntries: listAllWatchlists(db, { includeArchived: true }).flatMap((wl) =>
      listWatchlistItems(db, wl.id).map((e) => ({ watchlistId: wl.id, entry: e })),
    ),
  };
  db.insert(personalisationImportsExports)
    .values({
      id: randomUUID(),
      profileId: LOCAL_OWNER_PROFILE_ID,
      direction: 'export',
      formatVersion: 2,
      status: 'completed',
      itemCount:
        payload.watchlists.length +
        payload.savedSearches.length +
        payload.muteRules.length +
        payload.alertRules.length,
      sanitizedSummary: 'portable personalisation v2',
      createdAt: now(),
      completedAt: now(),
    })
    .run();
  return payload;
}

export function personalisationImportPreview(
  db: HealthspanDb,
  raw: unknown,
  mode: 'merge' | 'replace',
) {
  ensureLocalOwnerProfile(db);
  const data = (raw ?? {}) as Record<string, unknown>;
  if (data.dataMode === 'demo') {
    return {
      ok: false as const,
      error: 'Live/Demo mismatch: cannot import demo personalisation into Live',
    };
  }
  const counts = {
    watchlists: Array.isArray(data.watchlists) ? data.watchlists.length : 0,
    savedSearches: Array.isArray(data.savedSearches) ? data.savedSearches.length : 0,
    alertRules: Array.isArray(data.alertRules) ? data.alertRules.length : 0,
    muteRules: Array.isArray(data.muteRules) ? data.muteRules.length : 0,
    readingStates: Array.isArray(data.readingStates) ? data.readingStates.length : 0,
  };
  return {
    ok: true as const,
    mode,
    counts,
    unresolvedTargets: [] as string[],
    warning: 'No source records, secrets, paths, documents, or visit history are imported.',
  };
}

export function personalisationImportApply(
  db: HealthspanDb,
  raw: unknown,
  mode: 'merge' | 'replace' = 'merge',
) {
  const preview = personalisationImportPreview(db, raw, mode);
  if (!preview.ok) return preview;
  const data = (raw ?? {}) as Record<string, unknown>;
  if (mode === 'replace') {
    for (const wl of listAllWatchlists(db, { includeArchived: true })) {
      if (!wl.isDefault) {
        try {
          deleteWatchlist(db, wl.id);
        } catch {
          /* default protected */
        }
      }
    }
  }
  let imported = 0;
  let skipped = 0;
  if (Array.isArray(data.watchlists)) {
    for (const wl of data.watchlists as Array<{ name?: string; description?: string }>) {
      if (!wl.name) continue;
      try {
        createWatchlist(db, wl.name, wl.description);
        imported += 1;
      } catch {
        skipped += 1; // duplicate slug / protected default
      }
    }
  }
  if (Array.isArray(data.savedSearches)) {
    for (const s of data.savedSearches as Array<{
      name?: string;
      queryJson?: string;
      query?: unknown;
    }>) {
      if (!s.name) continue;
      try {
        const query =
          s.query ?? (s.queryJson ? JSON.parse(s.queryJson) : { searchSchemaVersion: 2 });
        createSavedSearch(db, s.name, query);
        imported += 1;
      } catch {
        skipped += 1;
      }
    }
  }
  if (Array.isArray(data.alertRules)) {
    for (const r of data.alertRules as unknown[]) {
      try {
        createAlertRule(db, {
          ...(typeof r === 'object' && r ? r : {}),
          name: (r as { name?: string }).name ?? 'Imported rule',
          targetType: (r as { targetType?: string }).targetType ?? 'event_type',
          eventKinds: JSON.parse((r as { eventKindsJson?: string }).eventKindsJson || '[]'),
        });
        imported += 1;
      } catch {
        /* skip invalid */
      }
    }
  }
  if (Array.isArray(data.muteRules)) {
    for (const m of data.muteRules as Array<{
      scopeType?: string;
      scopeId?: string;
      reason?: string;
    }>) {
      if (!m.scopeType) continue;
      createMuteRule(db, m.scopeType, m.scopeId, m.reason);
      imported += 1;
    }
  }
  const id = randomUUID();
  db.insert(personalisationImportsExports)
    .values({
      id,
      profileId: LOCAL_OWNER_PROFILE_ID,
      direction: 'import',
      formatVersion: 2,
      status: 'completed',
      itemCount: imported,
      sanitizedSummary: `${mode} apply`,
      createdAt: now(),
      completedAt: now(),
    })
    .run();
  return { ...preview, imported, skipped, importId: id };
}

export function personalisedToday(db: HealthspanDb) {
  const since = sinceLastVisitStable(db);
  const alertItems = listAlertsFiltered(db, { pageSize: 20 }).items.filter(
    (a) =>
      a.state === 'new' ||
      a.state === 'unread' ||
      a.importance === 'high' ||
      a.importance === 'critical',
  );
  const briefList = listBriefs(db);
  const latestDaily = briefList.find((b) => b.kind === 'daily') ?? null;
  const continueReading = listReadingStates(db).filter(
    (r) => r.readingState === 'opened' && r.personalSurfaceState === 'default',
  );
  const searches = listSavedSearches(db).filter((s) => s.state === 'active');
  const newMatches = searches.flatMap((s) =>
    listSavedSearchMatches(db, s.id)
      .slice(0, 5)
      .map((m) => ({ ...m, savedSearchId: s.id, savedSearchName: s.name })),
  );
  const wlChanges = listAllWatchlists(db).flatMap((wl) =>
    listWatchlistChanges(db, wl.id, 5).items.map((c) => ({
      ...c,
      watchlistId: wl.id,
      watchlistName: wl.name,
    })),
  );
  const coverage = latestDaily
    ? JSON.parse(latestDaily.sourceCoverageJson || '{}')
    : { sourcesSeen: [], partialReasons: ['no_brief_yet'] };
  return {
    urgentAlerts: alertItems.slice(0, 10),
    sinceLastVisit: since,
    latestDailyBrief: latestDaily,
    watchlistChanges: wlChanges.slice(0, 20),
    continueReading: continueReading.slice(0, 20),
    newSavedSearchMatches: newMatches.slice(0, 20),
    sourceCoverage: coverage,
  };
}
