import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DemoBanner, SkeletonBlock } from '@healthspan/ui';
import { DEMO_SNAPSHOT_NOTICE } from '@healthspan/core';
import { FollowButton, PageHeader } from '../components/Common';
import { apiFetch, fetchItems, fetchMode } from '../lib/api';
import { m6Api } from '../lib/m6Api';
import { useAsync } from '../hooks/useAsync';
import { formatWhen, itemPath } from '../lib/nav';
import { usePreferences } from '../state/PreferencesContext';

const KNOWN_LEGACY_KEYS = [
  'healthspan.preferences',
  'healthspan.prefs',
  'healthspan.followed',
  'healthspan.followedIds',
  'healthspan.theme',
  'healthspan.browserNotifications',
] as const;

const TARGET_TYPES = [
  'content_item',
  'intervention',
  'trial',
  'creator',
  'paper',
  'change_event',
] as const;

const ALERT_RULE_TARGETS = [
  'watchlist',
  'watchable',
  'saved_search',
  'topic',
  'source',
  'event_type',
  'all_official_safety',
] as const;

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type SavedSearchQueryV2 = {
  searchSchemaVersion: 2;
  textQuery?: string;
  entityTypes?: string[];
  filters?: {
    source?: string[];
    evidenceMaturity?: string[];
    studyDesign?: string[];
  };
  includeRetracted?: boolean;
};

function useLiveMode() {
  const modeState = useAsync(() => fetchMode(), []);
  return modeState.data?.dataMode ?? 'live';
}

function parseJsonField(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>;
  if (typeof raw !== 'string' || !raw.trim()) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function parseCsv(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinCsv(values: string[] | undefined): string {
  return (values ?? []).join(', ');
}

function downloadText(filename: string, body: string, mime: string) {
  const blob = new Blob([body], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function setBriefItemReading(
  briefId: string,
  itemId: string,
  readingState: 'read' | 'dismissed',
) {
  const res = await apiFetch(`/api/briefs/${briefId}/items/${itemId}/reading`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ readingState }),
  });
  if (!res.ok) throw new Error(`Brief item update failed: ${res.status}`);
  return res.json();
}

function Panel({
  title,
  children,
  actions,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

function HealthBadge({ status }: { status: string }) {
  const tone =
    status === 'healthy' || status === 'ok'
      ? 'text-emerald-600'
      : status === 'degraded' || status === 'warn'
        ? 'text-amber-600'
        : 'text-rose-600';
  return (
    <span className={`rounded-full border border-[var(--border)] px-2 py-0.5 text-xs ${tone}`}>
      {status}
    </span>
  );
}

function AvailabilityBadge({ availability }: { availability?: string }) {
  if (!availability || availability === 'available') return null;
  const tone = availability === 'redirected' ? 'text-amber-600' : 'text-rose-600';
  return (
    <span className={`rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] uppercase ${tone}`}>
      {availability}
    </span>
  );
}

function WhyIncludedPreview({ value }: { value: unknown }) {
  const obj = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const entries = Object.entries(obj);
  if (entries.length === 0) {
    return <p className="text-xs text-[var(--muted)]">No inclusion rationale recorded.</p>;
  }
  return (
    <dl className="grid gap-1 text-xs">
      {entries.map(([k, v]) => (
        <div key={k} className="flex flex-wrap gap-1">
          <dt className="font-medium text-[var(--muted)]">{k}:</dt>
          <dd>{typeof v === 'string' ? v : JSON.stringify(v)}</dd>
        </div>
      ))}
    </dl>
  );
}

const btnClass = 'rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm';
const btnSmClass = 'rounded-lg border border-[var(--border)] px-2 py-1 text-xs';
const inputClass = 'rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm';

export function WatchlistsPage() {
  const { id: routeId } = useParams();
  const mode = useLiveMode();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [lists, setLists] = useState<Array<Record<string, unknown>>>([]);
  const [selected, setSelected] = useState<string | null>(routeId ?? null);
  const [entries, setEntries] = useState<Array<Record<string, unknown>>>([]);
  const [changes, setChanges] = useState<Array<Record<string, unknown>>>([]);
  const [targetId, setTargetId] = useState('');
  const [targetType, setTargetType] = useState('content_item');
  const [filterType, setFilterType] = useState('');
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const loadEntries = useCallback(
    async (watchlistId: string) => {
      const r = await m6Api.getWatchlist(
        watchlistId,
        filterType ? { targetType: filterType } : undefined,
      );
      setEntries(r.items ?? r.entries ?? []);
      const ch = await m6Api.watchlistChanges(watchlistId);
      setChanges(ch.items ?? []);
    },
    [filterType],
  );

  async function reload() {
    if (mode !== 'live') return;
    const res = await m6Api.listWatchlists(includeArchived);
    setLists(res.items);
    const next =
      routeId && res.items.some((w) => String(w.id) === routeId)
        ? routeId
        : selected && res.items.some((w) => String(w.id) === selected)
          ? selected
          : res.items[0]
            ? String(res.items[0].id)
            : null;
    setSelected(next);
  }

  useEffect(() => {
    void reload().catch((e) => setError(String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, includeArchived, routeId]);

  useEffect(() => {
    if (!selected || mode !== 'live') return;
    void loadEntries(selected).catch((e) => setError(String(e)));
    setChecked(new Set());
  }, [selected, mode, loadEntries]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await m6Api.createWatchlist(name.trim());
      setName('');
      await reload();
    } catch (err) {
      setError(String(err));
    }
  }

  const selectedList = lists.find((w) => String(w.id) === selected);

  async function bulkRemove() {
    if (!selected || checked.size === 0) return;
    const actions = [...checked].map((watchableId) => ({ op: 'remove' as const, watchableId }));
    await m6Api.batchWatchlistItems(selected, actions);
    setChecked(new Set());
    await loadEntries(selected);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Watchlists"
        description="Named Live watchlists persist in SQLite. Demo follow state remains browser-local."
      />
      {mode === 'demo' ? <DemoBanner notice={DEMO_SNAPSHOT_NOTICE} /> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {mode === 'live' ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <form onSubmit={onCreate} className="flex flex-wrap gap-2">
              <input
                className={inputClass}
                placeholder="New watchlist name"
                value={name}
                onChange={(ev) => setName(ev.target.value)}
                aria-label="New watchlist name"
              />
              <button type="submit" className={btnClass}>
                Create
              </button>
            </form>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
              />
              Include archived
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Lists">
              <ul className="space-y-2 text-sm">
                {lists.map((w) => {
                  const archived = w.active === false;
                  return (
                    <li
                      key={String(w.id)}
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-2"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          className={`font-medium underline ${String(w.id) === selected ? 'text-[var(--fg)]' : ''}`}
                          to={`/watchlists/${String(w.id)}`}
                          onClick={() => setSelected(String(w.id))}
                        >
                          {String(w.name)}
                        </Link>
                        {w.isDefault ? (
                          <span className="text-[var(--muted)]">(default)</span>
                        ) : null}
                        {archived ? (
                          <span className="text-[10px] uppercase text-amber-600">archived</span>
                        ) : null}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                        <label className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={Boolean(w.alertEnabled)}
                            onChange={(e) =>
                              void m6Api
                                .updateWatchlistSettings(String(w.id), {
                                  alertEnabled: e.target.checked,
                                })
                                .then(reload)
                            }
                          />
                          Alerts
                        </label>
                        <label className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={Boolean(w.briefEnabled)}
                            onChange={(e) =>
                              void m6Api
                                .updateWatchlistSettings(String(w.id), {
                                  briefEnabled: e.target.checked,
                                })
                                .then(reload)
                            }
                          />
                          Briefs
                        </label>
                        <button
                          type="button"
                          className="underline"
                          onClick={() => {
                            const next = window.prompt('Rename watchlist', String(w.name));
                            if (!next?.trim()) return;
                            void m6Api.renameWatchlist(String(w.id), next.trim()).then(reload);
                          }}
                        >
                          Rename
                        </button>
                        {archived ? (
                          <button
                            type="button"
                            className="underline"
                            onClick={() => void m6Api.restoreWatchlist(String(w.id)).then(reload)}
                          >
                            Restore
                          </button>
                        ) : !w.isDefault ? (
                          <button
                            type="button"
                            className="underline"
                            onClick={() => {
                              if (!window.confirm(`Archive “${String(w.name)}”?`)) return;
                              void m6Api.archiveWatchlist(String(w.id)).then(reload);
                            }}
                          >
                            Archive
                          </button>
                        ) : null}
                        {!w.isDefault ? (
                          <button
                            type="button"
                            className="text-rose-600 underline"
                            onClick={() => {
                              if (
                                !window.confirm(
                                  `Permanently delete “${String(w.name)}”? This cannot be undone.`,
                                )
                              )
                                return;
                              void m6Api.deleteWatchlist(String(w.id)).then(reload);
                            }}
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Panel>

            <Panel
              title={selectedList ? String(selectedList.name) : 'Items'}
              actions={
                checked.size > 0 ? (
                  <button type="button" className={btnSmClass} onClick={() => void bulkRemove()}>
                    Remove selected ({checked.size})
                  </button>
                ) : null
              }
            >
              <div className="mb-2 flex flex-wrap gap-2">
                <select
                  className={btnSmClass}
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  aria-label="Filter by target type"
                >
                  <option value="">All types</option>
                  {TARGET_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <form
                className="flex flex-wrap gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!selected || !targetId.trim()) return;
                  void m6Api
                    .addWatchlistItem(selected, {
                      targetType,
                      targetId: targetId.trim(),
                      displayTitle: targetId.trim(),
                    })
                    .then(() => loadEntries(selected))
                    .then(() => setTargetId(''))
                    .catch((err) => setError(String(err)));
                }}
              >
                <select
                  className={btnSmClass}
                  value={targetType}
                  onChange={(ev) => setTargetType(ev.target.value)}
                  aria-label="Target type"
                >
                  {TARGET_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <input
                  className={btnSmClass}
                  placeholder="Target ID"
                  value={targetId}
                  onChange={(ev) => setTargetId(ev.target.value)}
                  aria-label="Target ID"
                />
                <button type="submit" className={btnSmClass}>
                  Add
                </button>
              </form>
              <ul className="mt-3 divide-y divide-[var(--border)] text-sm">
                {entries.map((e) => {
                  const w = e.watchable as Record<string, unknown> | null;
                  const wid = String(e.watchableId);
                  return (
                    <li key={String(e.id)} className="flex items-center justify-between gap-2 py-2">
                      <label className="flex flex-1 items-start gap-2">
                        <input
                          type="checkbox"
                          checked={checked.has(wid)}
                          onChange={(ev) => {
                            const next = new Set(checked);
                            if (ev.target.checked) next.add(wid);
                            else next.delete(wid);
                            setChecked(next);
                          }}
                        />
                        <span>
                          {String(w?.displayTitle ?? w?.targetId ?? e.watchableId)}{' '}
                          <span className="text-[var(--muted)]">
                            ({String(w?.targetType ?? '')})
                          </span>{' '}
                          <AvailabilityBadge availability={String(w?.availability ?? '')} />
                        </span>
                      </label>
                      <button
                        type="button"
                        className="text-xs underline"
                        onClick={() => {
                          if (!selected) return;
                          void m6Api
                            .removeWatchlistItem(selected, wid)
                            .then(() => loadEntries(selected));
                        }}
                      >
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </div>

          {selected ? (
            <Panel title="Recent changes">
              {changes.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No recent watchlist changes.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {changes.map((c) => {
                    const w = c.watchable as Record<string, unknown> | null;
                    return (
                      <li key={String(c.id)} className="flex flex-wrap items-center gap-2">
                        <span>{String(w?.displayTitle ?? w?.targetId ?? c.watchableId)}</span>
                        <AvailabilityBadge availability={String(w?.availability ?? '')} />
                        <span className="text-xs text-[var(--muted)]">
                          {formatWhen(new Date(Number(c.addedAt)).toISOString())}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          ) : null}
        </>
      ) : (
        <DemoFollowedSection />
      )}
    </div>
  );
}

function DemoFollowedSection() {
  const { prefs } = usePreferences();
  const { data, loading } = useAsync(() => fetchItems(), []);
  const followed = (data?.items ?? []).filter((item) => prefs.followedIds.includes(item.id));
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Demo followed items ({prefs.followedIds.length})</h2>
      </div>
      {loading ? (
        <SkeletonBlock className="h-24 w-full" />
      ) : followed.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          No followed items yet. Open a dossier and click Follow.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {followed.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <Link className="font-medium hover:underline" to={itemPath(item.type, item.id)}>
                  {item.title}
                </Link>
                <p className="text-xs text-[var(--muted)]">{item.type}</p>
              </div>
              <FollowButton id={item.id} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const emptySearchQuery = (): SavedSearchQueryV2 => ({
  searchSchemaVersion: 2,
  textQuery: '',
  entityTypes: [],
  filters: { source: [], evidenceMaturity: [], studyDesign: [] },
  includeRetracted: false,
});

export function SavedSearchesPage() {
  const mode = useLiveMode();
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [name, setName] = useState('');
  const [query, setQuery] = useState<SavedSearchQueryV2>(emptySearchQuery);
  const [runResults, setRunResults] = useState<Record<string, Record<string, unknown>>>({});
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const res = await m6Api.listSavedSearches();
    setItems(res.items);
  }

  useEffect(() => {
    if (mode !== 'live') return;
    void reload().catch((e) => setError(String(e)));
  }, [mode]);

  function updateFilter(key: 'source' | 'evidenceMaturity' | 'studyDesign', value: string) {
    setQuery((q) => ({
      ...q,
      filters: { ...q.filters, [key]: parseCsv(value) },
    }));
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Saved Searches"
        description="Structured filter builder — no browser SQL or regular expressions."
      />
      {mode === 'demo' ? <DemoBanner notice={DEMO_SNAPSHOT_NOTICE} /> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {mode === 'live' ? (
        <>
          <form
            className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
            onSubmit={(e) => {
              e.preventDefault();
              void m6Api
                .createSavedSearch(name.trim() || 'Untitled search', {
                  ...query,
                  textQuery: query.textQuery?.trim() || undefined,
                })
                .then(() => {
                  setName('');
                  setQuery(emptySearchQuery());
                  return reload();
                })
                .catch((err) => setError(String(err)));
            }}
          >
            <h2 className="text-sm font-semibold">Builder (schema v2)</h2>
            <input
              className={`w-full ${inputClass}`}
              placeholder="Name"
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              aria-label="Saved search name"
            />
            <input
              className={`w-full ${inputClass}`}
              placeholder="Text query"
              value={query.textQuery ?? ''}
              onChange={(ev) => setQuery((q) => ({ ...q, textQuery: ev.target.value }))}
              aria-label="Text query"
            />
            <label className="block text-sm">
              Entity types (comma-separated)
              <input
                className={`mt-1 w-full ${inputClass}`}
                value={joinCsv(query.entityTypes)}
                onChange={(ev) =>
                  setQuery((q) => ({ ...q, entityTypes: parseCsv(ev.target.value) }))
                }
              />
            </label>
            <div className="grid gap-2 sm:grid-cols-3">
              <label className="block text-sm">
                Source filter
                <input
                  className={`mt-1 w-full ${inputClass}`}
                  value={joinCsv(query.filters?.source)}
                  onChange={(ev) => updateFilter('source', ev.target.value)}
                />
              </label>
              <label className="block text-sm">
                Evidence maturity
                <input
                  className={`mt-1 w-full ${inputClass}`}
                  value={joinCsv(query.filters?.evidenceMaturity)}
                  onChange={(ev) => updateFilter('evidenceMaturity', ev.target.value)}
                />
              </label>
              <label className="block text-sm">
                Study design
                <input
                  className={`mt-1 w-full ${inputClass}`}
                  value={joinCsv(query.filters?.studyDesign)}
                  onChange={(ev) => updateFilter('studyDesign', ev.target.value)}
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(query.includeRetracted)}
                onChange={(e) => setQuery((q) => ({ ...q, includeRetracted: e.target.checked }))}
              />
              Include retracted
            </label>
            <button type="submit" className={btnClass}>
              Save search
            </button>
          </form>

          <Panel title="Saved">
            <ul className="space-y-3 text-sm">
              {items.map((s) => {
                const sid = String(s.id);
                const run = runResults[sid];
                return (
                  <li
                    key={sid}
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Link className="font-medium underline" to={`/saved-searches/${sid}`}>
                        {String(s.name)}
                      </Link>
                      <span className="text-[var(--muted)]">{String(s.state)}</span>
                      {s.needsUpdate ? (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] uppercase text-amber-800">
                          needs update
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(s.alertEnabled)}
                          onChange={(e) =>
                            void m6Api
                              .updateSavedSearch(sid, { alertEnabled: e.target.checked })
                              .then(reload)
                          }
                        />
                        Alerts
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(s.briefEnabled)}
                          onChange={(e) =>
                            void m6Api
                              .updateSavedSearch(sid, { briefEnabled: e.target.checked })
                              .then(reload)
                          }
                        />
                        Briefs
                      </label>
                      <button
                        type="button"
                        className="underline"
                        onClick={() =>
                          void m6Api
                            .runSavedSearch(sid)
                            .then((r) => {
                              setRunResults((prev) => ({
                                ...prev,
                                [sid]: r as Record<string, unknown>,
                              }));
                            })
                            .catch((err) => setError(String(err)))
                        }
                      >
                        Run
                      </button>
                      {run ? (
                        <span className="text-[var(--muted)]">
                          {String(run.status ?? 'ok')} · {String(run.newCount ?? 0)} new
                          {run.capped ? ' (capped)' : ''}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        className="underline"
                        onClick={() =>
                          void m6Api
                            .savedSearchHistory(sid)
                            .then((r) => {
                              setHistoryId(sid);
                              setHistory(r.items ?? []);
                            })
                            .catch((err) => setError(String(err)))
                        }
                      >
                        History
                      </button>
                      {String(s.state) === 'archived' ? (
                        <button
                          type="button"
                          className="underline"
                          onClick={() => void m6Api.restoreSavedSearch(sid).then(reload)}
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="underline"
                          onClick={() => void m6Api.archiveSavedSearch(sid).then(reload)}
                        >
                          Archive
                        </button>
                      )}
                      <button
                        type="button"
                        className="text-rose-600 underline"
                        onClick={() => {
                          if (!window.confirm(`Delete “${String(s.name)}”?`)) return;
                          void m6Api.deleteSavedSearch(sid).then(reload);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>

          {historyId ? (
            <Panel
              title="Run history"
              actions={
                <button type="button" className={btnSmClass} onClick={() => setHistoryId(null)}>
                  Close
                </button>
              }
            >
              {history.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No evaluation history yet.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {history.map((h) => (
                    <li key={String(h.id)}>
                      {formatWhen(new Date(Number(h.completedAt ?? h.startedAt)).toISOString())} —{' '}
                      {String(h.status)} · matched {String(h.matchedCount)} · new{' '}
                      {String(h.newCount)}
                      {Number(h.cappedCount) > 0 ? ` (capped +${String(h.cappedCount)})` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export function SavedSearchDetailPage() {
  const { id = '' } = useParams();
  const [item, setItem] = useState<Record<string, unknown> | null>(null);
  const [matches, setMatches] = useState<Array<Record<string, unknown>>>([]);
  useEffect(() => {
    void m6Api.listSavedSearches().then((r) => {
      setItem(r.items.find((x) => String(x.id) === id) ?? null);
    });
    void m6Api.savedSearchMatches(id).then((r) => setMatches(r.items ?? []));
  }, [id]);
  const parsed = parseJsonField(item?.queryJson);
  return (
    <div className="space-y-4">
      <PageHeader
        title={String(item?.name ?? 'Saved search')}
        description="Structured saved search detail"
      />
      {item?.needsUpdate ? (
        <p className="text-sm text-amber-600">This search was migrated and may need review.</p>
      ) : null}
      <Panel title="Query">
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--muted)]">Text</dt>
            <dd>{String(parsed.textQuery ?? parsed.text ?? '—')}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Entity types</dt>
            <dd>{joinCsv((parsed.entityTypes as string[]) ?? []) || '—'}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Include retracted</dt>
            <dd>{parsed.includeRetracted ? 'yes' : 'no'}</dd>
          </div>
        </dl>
      </Panel>
      <Panel title="Recent matches">
        {matches.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No matches recorded yet.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {matches.map((m) => (
              <li key={String(m.id)}>
                {String(m.watchableId)}{' '}
                <span className="text-[var(--muted)]">
                  {formatWhen(new Date(Number(m.lastMatchedAt)).toISOString())}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Link className="text-sm underline" to="/saved-searches">
        Back to saved searches
      </Link>
    </div>
  );
}

export function AlertsPage() {
  const mode = useLiveMode();
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [stateFilter, setStateFilter] = useState('all');
  const [familyFilter, setFamilyFilter] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    await m6Api.evaluateAlerts().catch(() => undefined);
    const res = await m6Api.listAlerts(
      familyFilter === 'all' ? undefined : { family: familyFilter },
    );
    setItems(res.items);
    setSelected(new Set());
  }

  useEffect(() => {
    if (mode !== 'live') return;
    void reload().catch((e) => setError(String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, familyFilter]);

  const filtered = useMemo(
    () => (stateFilter === 'all' ? items : items.filter((a) => String(a.state) === stateFilter)),
    [items, stateFilter],
  );

  async function batchRead() {
    if (selected.size === 0) return;
    const actions = [...selected].map((alertId) => ({ alertId, action: 'read' as const }));
    await m6Api.batchAlerts(actions);
    await reload();
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Alert Centre"
        description="Deterministic research/operational alerts — not personal clinical risk."
      />
      {mode === 'demo' ? <DemoBanner notice={DEMO_SNAPSHOT_NOTICE} /> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        {['all', 'new', 'read', 'dismissed', 'resolved'].map((s) => (
          <button
            key={s}
            type="button"
            className={btnSmClass}
            aria-pressed={stateFilter === s}
            onClick={() => setStateFilter(s)}
          >
            {s}
          </button>
        ))}
        <span className="mx-1 text-[var(--muted)]">|</span>
        {['all', 'research', 'operational'].map((f) => (
          <button
            key={f}
            type="button"
            className={btnSmClass}
            aria-pressed={familyFilter === f}
            onClick={() => setFamilyFilter(f)}
          >
            {f}
          </button>
        ))}
        {selected.size > 0 ? (
          <button type="button" className={btnSmClass} onClick={() => void batchRead()}>
            Mark selected read ({selected.size})
          </button>
        ) : null}
        <button type="button" className={btnSmClass} onClick={() => void reload()}>
          Refresh
        </button>
      </div>
      <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        {filtered.map((a) => {
          const aid = String(a.id);
          const why = a.whyIncluded ?? parseJsonField(a.whyIncludedJson);
          return (
            <li key={aid} className="space-y-2 px-4 py-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={selected.has(aid)}
                    onChange={(e) => {
                      const next = new Set(selected);
                      if (e.target.checked) next.add(aid);
                      else next.delete(aid);
                      setSelected(next);
                    }}
                  />
                  <div>
                    <Link className="font-medium underline" to={`/alerts/${aid}`}>
                      {String(a.title)}
                    </Link>
                    <p className="text-xs text-[var(--muted)]">
                      {String(a.family ?? 'research')} · {String(a.importance)} · {String(a.state)}{' '}
                      · {formatWhen(new Date(Number(a.occurredAt)).toISOString())}
                    </p>
                  </div>
                </label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ['read', 'Read'],
                      ['acknowledge', 'Ack'],
                      ['snooze', 'Snooze'],
                      ['dismiss', 'Dismiss'],
                      ['resolve', 'Resolve'],
                    ] as const
                  ).map(([action, label]) => (
                    <button
                      key={action}
                      type="button"
                      className="text-xs underline"
                      onClick={() =>
                        void m6Api
                          .alertAction(
                            aid,
                            action,
                            action === 'snooze' ? { snoozeUntil: Date.now() + 4 * 3600_000 } : {},
                          )
                          .then(reload)
                          .catch((e) => setError(String(e)))
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <WhyIncludedPreview value={why} />
            </li>
          );
        })}
      </ul>
      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No alerts in this filter.</p>
      ) : null}
    </div>
  );
}

export function AlertDetailPage() {
  const { id = '' } = useParams();
  const [item, setItem] = useState<Record<string, unknown> | null>(null);
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);
  useEffect(() => {
    void m6Api
      .getAlert(id)
      .then((r) => {
        setItem(r.item);
        setHistory(r.history ?? []);
      })
      .catch(() => {
        setItem(null);
        setHistory([]);
      });
  }, [id]);
  const why = item?.whyIncluded ?? parseJsonField(item?.whyIncludedJson);
  const severity = (item?.severity ?? parseJsonField(item?.severityJson)) as Record<
    string,
    unknown
  >;
  return (
    <div className="space-y-4">
      <PageHeader
        title={String(item?.title ?? 'Alert')}
        description="Alert detail and why-included payload"
      />
      <Panel title="Summary">
        <p className="text-sm">
          <strong>State:</strong> {String(item?.state ?? '—')} · <strong>Family:</strong>{' '}
          {String(item?.family ?? severity?.family ?? '—')} · <strong>Importance:</strong>{' '}
          {String(item?.importance ?? '—')}
        </p>
        <p className="mt-2 text-sm">{String(item?.summary ?? '')}</p>
      </Panel>
      <Panel title="Severity">
        <WhyIncludedPreview value={severity} />
      </Panel>
      <Panel title="Why included">
        <WhyIncludedPreview value={why} />
      </Panel>
      <Panel title="History">
        {history.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No state transitions recorded.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {history.map((h) => (
              <li key={String(h.id)}>
                {String(h.fromState)} → {String(h.toState)}{' '}
                <span className="text-[var(--muted)]">
                  {formatWhen(new Date(Number(h.createdAt)).toISOString())}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Link className="text-sm underline" to="/alerts">
        Back to Alert Centre
      </Link>
    </div>
  );
}

export function BriefsPage() {
  const mode = useLiveMode();
  const [view, setView] = useState<'current' | 'history'>('current');
  const [kind, setKind] = useState<'daily' | 'weekly'>('daily');
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const [briefRes, statusRes] = await Promise.all([m6Api.listBriefs(), m6Api.briefingStatus()]);
    setItems(briefRes.items);
    setStatus(statusRes.status ?? null);
  }

  useEffect(() => {
    if (mode !== 'live') return;
    void reload().catch((e) => setError(String(e)));
  }, [mode]);

  const kindItems = items.filter((b) => String(b.kind) === kind);
  const currentBrief = kindItems[0] ?? null;
  const schedule = (status?.schedule ?? {}) as Record<string, unknown>;
  const lastDaily = status?.lastDailyRun as Record<string, unknown> | null;
  const lastWeekly = status?.lastWeeklyRun as Record<string, unknown> | null;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Briefings"
        description="Daily and weekly research briefings from Live personalisation."
      />
      {mode === 'demo' ? <DemoBanner notice={DEMO_SNAPSHOT_NOTICE} /> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {status ? (
        <Panel title="Schedule & last runs">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[var(--muted)]">Timezone</dt>
              <dd>{String((schedule as { timezone?: string }).timezone ?? '—')}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Daily</dt>
              <dd>
                {String(
                  (schedule as { daily?: { enabled?: boolean; timeLocal?: string } }).daily?.enabled
                    ? 'enabled'
                    : 'disabled',
                )}{' '}
                at{' '}
                {String((schedule as { daily?: { timeLocal?: string } }).daily?.timeLocal ?? '—')}
                {lastDaily ? (
                  <span className="text-[var(--muted)]">
                    {' '}
                    · last {formatWhen(new Date(Number(lastDaily.completedAt)).toISOString())}
                  </span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Weekly</dt>
              <dd>
                {String(
                  (
                    schedule as {
                      weekly?: { enabled?: boolean; timeLocal?: string; weekday?: number };
                    }
                  ).weekly?.enabled
                    ? 'enabled'
                    : 'disabled',
                )}{' '}
                at{' '}
                {String((schedule as { weekly?: { timeLocal?: string } }).weekly?.timeLocal ?? '—')}
                {lastWeekly ? (
                  <span className="text-[var(--muted)]">
                    {' '}
                    · last {formatWhen(new Date(Number(lastWeekly.completedAt)).toISOString())}
                  </span>
                ) : null}
              </dd>
            </div>
          </dl>
        </Panel>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={btnClass}
          aria-pressed={view === 'current'}
          onClick={() => setView('current')}
        >
          Current
        </button>
        <button
          type="button"
          className={btnClass}
          aria-pressed={view === 'history'}
          onClick={() => setView('history')}
        >
          History
        </button>
        <button
          type="button"
          className={btnClass}
          aria-pressed={kind === 'daily'}
          onClick={() => setKind('daily')}
        >
          Daily
        </button>
        <button
          type="button"
          className={btnClass}
          aria-pressed={kind === 'weekly'}
          onClick={() => setKind('weekly')}
        >
          Weekly
        </button>
        <button
          type="button"
          className={btnClass}
          onClick={() =>
            void m6Api
              .generateBrief(kind)
              .then(reload)
              .catch((e) => setError(String(e)))
          }
        >
          Generate {kind}
        </button>
      </div>

      {view === 'current' ? (
        currentBrief ? (
          <Panel title={`Current ${kind} brief`}>
            <Link className="font-medium underline" to={`/briefs/${String(currentBrief.id)}`}>
              {String(currentBrief.title ?? `${kind} brief`)}
            </Link>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {formatWhen(new Date(Number(currentBrief.createdAt)).toISOString())}
            </p>
          </Panel>
        ) : (
          <p className="text-sm text-[var(--muted)]">No current {kind} brief yet.</p>
        )
      ) : (
        <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          {kindItems.map((b) => (
            <li key={String(b.id)} className="px-4 py-3 text-sm">
              <Link className="font-medium underline" to={`/briefs/${String(b.id)}`}>
                {String(b.title ?? `${b.kind} brief`)}
              </Link>
              <p className="text-xs text-[var(--muted)]">
                {formatWhen(new Date(Number(b.createdAt)).toISOString())}
              </p>
            </li>
          ))}
        </ul>
      )}
      {view === 'history' && kindItems.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No {kind} briefs yet.</p>
      ) : null}
    </div>
  );
}

export function BriefDetailPage() {
  const { id = '' } = useParams();
  const [data, setData] = useState<{
    brief: Record<string, unknown>;
    items: Array<Record<string, unknown>>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const next = await m6Api.getBrief(id);
    setData(next);
  }

  useEffect(() => {
    void reload().catch(() => setData(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const coverage = parseJsonField(data?.brief.sourceCoverageJson);

  async function exportBrief(format: 'markdown' | 'json') {
    try {
      const exported = await m6Api.exportBrief(id, format);
      const body = String((exported as { body?: string }).body ?? '');
      const filename = String(
        (exported as { filename?: string }).filename ??
          `brief-${id}.${format === 'json' ? 'json' : 'md'}`,
      );
      downloadText(filename, body, format === 'json' ? 'application/json' : 'text/markdown');
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={String(data?.brief.title ?? 'Brief')}
        description="Brief detail, source coverage, and export"
        actions={
          <div className="flex gap-2">
            <button type="button" className={btnClass} onClick={() => void exportBrief('markdown')}>
              Export Markdown
            </button>
            <button type="button" className={btnClass} onClick={() => void exportBrief('json')}>
              Export JSON
            </button>
          </div>
        }
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Panel title="Source coverage">
        <WhyIncludedPreview value={coverage} />
      </Panel>
      <Panel title="Items">
        <ul className="space-y-2 text-sm">
          {(data?.items ?? []).map((i) => (
            <li
              key={String(i.id)}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-2"
            >
              <div>
                <p className="font-medium">{String(i.title ?? i.section ?? i.id)}</p>
                <p className="text-xs text-[var(--muted)]">
                  {String(i.readingState ?? 'unread')} · {String(i.reason ?? '')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="text-xs underline"
                  onClick={() => void setBriefItemReading(id, String(i.id), 'read').then(reload)}
                >
                  Mark read
                </button>
                <button
                  type="button"
                  className="text-xs underline"
                  onClick={() =>
                    void setBriefItemReading(id, String(i.id), 'dismissed').then(reload)
                  }
                >
                  Dismiss
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
      <Link className="text-sm underline" to="/briefs">
        Back to briefings
      </Link>
    </div>
  );
}

export function OperationsPage() {
  const overview = useAsync(() => m6Api.opsOverview(), []);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [diagRaw, setDiagRaw] = useState<unknown>(null);
  const panels = (overview.data?.panels ?? overview.data) as Record<string, unknown> | undefined;

  async function runAction(label: string, fn: () => Promise<unknown>) {
    try {
      const result = await fn();
      setActionMsg(`${label}: ${JSON.stringify(result)}`);
      if (label === 'Diagnostics') setDiagRaw(result);
    } catch (e) {
      setActionMsg(`${label} failed: ${String(e)}`);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Operations"
        description="Local runtime, database, scheduler, backups, and storage."
      />
      {overview.loading ? <SkeletonBlock className="h-40 w-full" /> : null}
      {overview.error ? <p className="text-sm text-red-600">{overview.error}</p> : null}
      {actionMsg ? <p className="text-sm text-[var(--muted)]">{actionMsg}</p> : null}

      {panels ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Panel title="Overall health">
            <HealthBadge status={String(panels.overall ?? 'unknown')} />
          </Panel>
          <Panel title="Versions">
            <dl className="space-y-1 text-sm">
              {Object.entries((panels.versions as Record<string, unknown>) ?? {}).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <dt className="text-[var(--muted)]">{k}</dt>
                  <dd>{String(v)}</dd>
                </div>
              ))}
            </dl>
          </Panel>
          <Panel title="Database">
            <dl className="space-y-1 text-sm">
              {Object.entries((panels.database as Record<string, unknown>) ?? {}).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <dt className="text-[var(--muted)]">{k}</dt>
                  <dd>{String(v)}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className={btnSmClass}
                onClick={() => void runAction('DB check', () => m6Api.opsDbCheck())}
              >
                Check database
              </button>
              <button
                type="button"
                className={btnSmClass}
                onClick={() => void runAction('Optimize', () => m6Api.opsDbOptimize())}
              >
                Optimize
              </button>
            </div>
          </Panel>
          <Panel title="Scheduler">
            <pre className="max-h-48 overflow-auto text-xs" tabIndex={0}>
              {JSON.stringify(panels.scheduler ?? {}, null, 2)}
            </pre>
          </Panel>
          <Panel title="Backups">
            <ul className="space-y-1 text-sm">
              {((panels.backups as Array<Record<string, unknown>>) ?? []).map((b) => (
                <li key={String(b.name)}>{String(b.name)}</li>
              ))}
            </ul>
          </Panel>
          <Panel title="Storage">
            <ul className="space-y-1 text-sm">
              {((panels.storage as Array<Record<string, unknown>>) ?? []).map((s) => (
                <li key={String(s.category ?? s.path)}>
                  {String(s.category)}: {String(s.fileCount)} files / {String(s.byteLength)} bytes
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Security">
            <dl className="space-y-1 text-sm">
              {Object.entries((panels.security as Record<string, unknown>) ?? {}).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[var(--muted)]">{k}</dt>
                  <dd>{typeof v === 'string' ? v : JSON.stringify(v)}</dd>
                </div>
              ))}
            </dl>
          </Panel>
          <Panel title="Recent errors">
            {((panels.recentErrors as Array<Record<string, unknown>>) ?? []).length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No recent warnings or errors.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {((panels.recentErrors as Array<Record<string, unknown>>) ?? []).map((e) => (
                  <li key={String(e.id)} className="rounded border border-[var(--border)] p-2">
                    <span className="text-xs uppercase text-[var(--muted)]">
                      {String(e.severity)}
                    </span>
                    <p>{String(e.message)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={btnClass}
          onClick={() => void runAction('Diagnostics', () => m6Api.opsDiagnostics())}
        >
          Create diagnostic bundle
        </button>
      </div>

      <details className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <summary className="cursor-pointer text-sm font-semibold">Raw diagnostics</summary>
        <pre className="mt-3 overflow-auto text-xs" tabIndex={0}>
          {JSON.stringify(diagRaw ?? overview.data ?? {}, null, 2)}
        </pre>
      </details>
    </div>
  );
}

export function BackupSettingsPage() {
  const [backups, setBackups] = useState<Array<Record<string, unknown>>>([]);
  const [storage, setStorage] = useState<Array<Record<string, unknown>>>([]);
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);
  const [prunePreview, setPrunePreview] = useState<Record<string, unknown> | null>(null);
  const [retentionPreviewData, setRetentionPreviewData] = useState<Record<string, unknown> | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const keepNewest = 14;

  async function reload() {
    const [b, s, st] = await Promise.all([
      m6Api.listBackups(),
      m6Api.storage(),
      m6Api.backupStatus(),
    ]);
    setBackups(b.items ?? []);
    setStorage(s.categories ?? []);
    setStatus(st.status ?? null);
  }

  useEffect(() => {
    void reload().catch((e) => setMessage(String(e)));
  }, []);

  const tiers = (status?.tiers as Array<Record<string, unknown>>) ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Backup & Storage"
        description="Create recovery/portable backups, verify archives, and review storage. Restore remains CLI-only."
      />
      {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}

      {status ? (
        <Panel title="Backup status">
          <dl className="space-y-1 text-sm">
            <div>
              <dt className="text-[var(--muted)]">Last successful</dt>
              <dd>
                {status.lastSuccessful
                  ? String((status.lastSuccessful as Record<string, unknown>).name)
                  : 'None yet'}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Restore CLI</dt>
              <dd>
                <code className="text-xs">{String(status.restoreCli ?? '')}</code>
              </dd>
            </div>
          </dl>
        </Panel>
      ) : null}

      {tiers.length > 0 ? (
        <Panel title="Backup tiers">
          <ul className="space-y-2 text-sm">
            {tiers.map((t) => (
              <li key={String(t.id)} className="rounded border border-[var(--border)] p-2">
                <p className="font-medium">{String(t.label)}</p>
                <p className="text-xs text-[var(--muted)]">
                  {String(t.purpose)} · encryption: {String(t.encryption)}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel title="Create">
        <input
          type="password"
          className={`w-full ${inputClass}`}
          placeholder="Portable passphrase (not persisted)"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          aria-label="Portable passphrase"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className={btnClass}
            onClick={() =>
              void m6Api
                .createBackup({ tier: 'recovery_checkpoint', allowUnencrypted: true })
                .then(() => {
                  setMessage('Recovery checkpoint created.');
                  return reload();
                })
                .catch((e) => setMessage(String(e)))
            }
          >
            Create recovery
          </button>
          <button
            type="button"
            className={btnClass}
            onClick={() =>
              void m6Api
                .createBackup({ tier: 'portable_core', passphrase })
                .then(() => {
                  setMessage('Portable core created.');
                  setPassphrase('');
                  return reload();
                })
                .catch((e) => setMessage(String(e)))
            }
          >
            Create portable core
          </button>
          <button
            type="button"
            className={btnClass}
            onClick={() =>
              void m6Api
                .createBackup({ tier: 'portable_full', passphrase, includeRaw: true })
                .then(() => {
                  setMessage('Portable full created.');
                  setPassphrase('');
                  return reload();
                })
                .catch((e) => setMessage(String(e)))
            }
          >
            Create portable full
          </button>
        </div>
      </Panel>

      <Panel title="Archives">
        <ul className="space-y-2 text-sm">
          {backups.map((b) => (
            <li key={String(b.name)} className="flex flex-wrap items-center gap-2">
              <span>{String(b.name)}</span>
              <button
                type="button"
                className="text-xs underline"
                onClick={() =>
                  void m6Api
                    .verifyBackup({ archiveName: b.name, passphrase: passphrase || undefined })
                    .then((r) => setMessage(`Verify ${String(b.name)}: ${JSON.stringify(r)}`))
                    .catch((e) => setMessage(String(e)))
                }
              >
                Verify
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel
        title="Prune"
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              className={btnSmClass}
              onClick={() =>
                void m6Api
                  .prunePreview(keepNewest)
                  .then((r) => setPrunePreview(r as Record<string, unknown>))
                  .catch((e) => setMessage(String(e)))
              }
            >
              Preview
            </button>
            <button
              type="button"
              className={btnSmClass}
              onClick={() =>
                void m6Api
                  .pruneApply(keepNewest)
                  .then((r) => {
                    setMessage(`Prune applied: ${JSON.stringify(r)}`);
                    return reload();
                  })
                  .catch((e) => setMessage(String(e)))
              }
            >
              Apply
            </button>
          </div>
        }
      >
        {prunePreview ? (
          <div className="text-sm">
            <p className="text-[var(--muted)]">{String(prunePreview.protectedExplanation)}</p>
            <p className="mt-2">
              Candidates: {((prunePreview.candidates as unknown[]) ?? []).length}
            </p>
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]">Preview prune to see protected sets.</p>
        )}
      </Panel>

      <Panel
        title="Retention"
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              className={btnSmClass}
              onClick={() =>
                void m6Api
                  .retentionPreview()
                  .then((r) => setRetentionPreviewData(r as Record<string, unknown>))
                  .catch((e) => setMessage(String(e)))
              }
            >
              Preview
            </button>
            <button
              type="button"
              className={btnSmClass}
              onClick={() =>
                void m6Api
                  .retentionApply()
                  .then((r) => setMessage(`Retention applied: ${JSON.stringify(r)}`))
                  .catch((e) => setMessage(String(e)))
              }
            >
              Apply
            </button>
          </div>
        }
      >
        {retentionPreviewData ? (
          <ul className="space-y-1 text-sm">
            {((retentionPreviewData.candidates as Array<Record<string, unknown>>) ?? []).map(
              (c) => (
                <li key={String(c.category)}>
                  {String(c.category)}: {String(c.action)} ({String(c.days)} days)
                </li>
              ),
            )}
          </ul>
        ) : (
          <p className="text-sm text-[var(--muted)]">
            Preview retention to see candidate categories.
          </p>
        )}
      </Panel>

      <Panel title="Storage">
        <ul className="space-y-1 text-sm">
          {storage.map((c) => (
            <li key={String(c.category)}>
              {String(c.category)}: {String(c.fileCount)} files / {String(c.byteLength)} bytes
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

export function PersonalisationMigrationPage() {
  const [detected, setDetected] = useState<Record<string, string>>({});
  const [raw, setRaw] = useState('');
  const [preview, setPreview] = useState<unknown>(null);
  const [migration, setMigration] = useState<Record<string, unknown> | null>(null);
  const [portableRaw, setPortableRaw] = useState('');
  const [portablePreview, setPortablePreview] = useState<unknown>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const found: Record<string, string> = {};
    for (const key of KNOWN_LEGACY_KEYS) {
      try {
        const val = localStorage.getItem(key);
        if (val) found[key] = val;
      } catch {
        /* ignore */
      }
    }
    setDetected(found);
    const primary = found['healthspan.preferences'] ?? found['healthspan.prefs'] ?? '';
    if (primary) setRaw(primary);
    void m6Api
      .migrationStatus()
      .then((r) => setMigration((r.status ?? r) as Record<string, unknown>))
      .catch(() => undefined);
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Personalisation migration"
        description="Preview and import known Live legacy browser keys into SQLite. Demo IDs are blocked."
      />

      {migration ? (
        <Panel title="Migration status">
          <p className="text-sm">
            Completed: {migration.completed ? 'yes' : 'no'}
            {migration.lastRun ? (
              <span className="text-[var(--muted)]">
                {' '}
                · last {String((migration.lastRun as Record<string, unknown>).status)}
              </span>
            ) : null}
          </p>
        </Panel>
      ) : null}

      <Panel title="Detected legacy keys">
        {Object.keys(detected).length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No known legacy keys found in localStorage.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {Object.keys(detected).map((k) => (
              <li key={k}>
                <code>{k}</code>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <textarea
        className="min-h-40 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 font-mono text-xs"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        aria-label="Legacy preferences JSON"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={btnClass}
          onClick={() => {
            try {
              const prefs = JSON.parse(raw);
              void m6Api
                .importPreview(prefs)
                .then(setPreview)
                .catch((e) => setMessage(String(e)));
            } catch (e) {
              setMessage(String(e));
            }
          }}
        >
          Preview legacy import
        </button>
        <button
          type="button"
          className={btnClass}
          onClick={() => {
            try {
              const prefs = JSON.parse(raw);
              void m6Api
                .importApply(prefs)
                .then((r) => {
                  setPreview(r);
                  setMessage('Legacy import completed (idempotent).');
                })
                .catch((e) => setMessage(String(e)));
            } catch (e) {
              setMessage(String(e));
            }
          }}
        >
          Import legacy
        </button>
        <button
          type="button"
          className={btnClass}
          onClick={() =>
            downloadText('healthspan-legacy-preferences.json', raw, 'application/json')
          }
        >
          Export legacy
        </button>
        <button
          type="button"
          className={btnClass}
          onClick={() =>
            void m6Api
              .migrationSkip()
              .then((r) => {
                const body = r as { status?: Record<string, unknown> };
                setMigration(body.status ?? (r as Record<string, unknown>));
                setMessage('Migration skipped — remind later.');
              })
              .catch((e) => setMessage(String(e)))
          }
        >
          Skip / remind later
        </button>
      </div>

      <Panel title="Portable export / import">
        <div className="mb-2 flex flex-wrap gap-2">
          <button
            type="button"
            className={btnClass}
            onClick={() =>
              void m6Api
                .portableExport()
                .then((r) => {
                  const payload = JSON.stringify(r, null, 2);
                  setPortableRaw(payload);
                  setMessage('Portable export loaded below.');
                })
                .catch((e) => setMessage(String(e)))
            }
          >
            Export portable
          </button>
          <select
            className={btnSmClass}
            value={importMode}
            onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}
            aria-label="Import mode"
          >
            <option value="merge">merge</option>
            <option value="replace">replace</option>
          </select>
          <button
            type="button"
            className={btnClass}
            onClick={() => {
              try {
                const payload = JSON.parse(portableRaw || '{}');
                void m6Api
                  .portableImportPreview(payload, importMode)
                  .then(setPortablePreview)
                  .catch((e) => setMessage(String(e)));
              } catch (e) {
                setMessage(String(e));
              }
            }}
          >
            Preview portable import
          </button>
          <button
            type="button"
            className={btnClass}
            onClick={() => {
              try {
                const payload = JSON.parse(portableRaw || '{}');
                void m6Api
                  .portableImportApply(payload, importMode)
                  .then((r) => {
                    setPortablePreview(r);
                    setMessage(`Portable import (${importMode}) applied.`);
                  })
                  .catch((e) => setMessage(String(e)));
              } catch (e) {
                setMessage(String(e));
              }
            }}
          >
            Apply portable import
          </button>
        </div>
        <textarea
          className="min-h-32 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] p-2 font-mono text-xs"
          value={portableRaw}
          onChange={(e) => setPortableRaw(e.target.value)}
          aria-label="Portable import JSON"
        />
      </Panel>

      {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}
      {preview ? (
        <pre className="overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-xs">
          {JSON.stringify(preview, null, 2)}
        </pre>
      ) : null}
      {portablePreview ? (
        <pre className="overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-xs">
          {JSON.stringify(portablePreview, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

export function PrivacySecurityPage() {
  const security = useAsync(() => m6Api.opsSecurity(), []);
  const [notifPref, setNotifPref] = useState(false);
  const [perm, setPerm] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied',
  );
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void m6Api
      .getPreference('browserNotifications')
      .then((r) => {
        const val = r.preference?.value;
        setNotifPref(val === true || val === 1 || val === '1');
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Privacy & Security"
        description="Local-only profile, request integrity, retention, backup exclusions, and browser notifications."
      />

      {security.data ? (
        <Panel title="Security status">
          <dl className="space-y-1 text-sm">
            <div>
              <dt className="text-[var(--muted)]">Request integrity</dt>
              <dd>
                {String(
                  (security.data.requestIntegrity as { hasSession?: boolean })?.hasSession
                    ? 'active session'
                    : 'no session',
                )}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Binding</dt>
              <dd>{String(security.data.binding ?? '—')}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Allowed hosts</dt>
              <dd>{String(security.data.allowedHosts ?? '—')}</dd>
            </div>
          </dl>
        </Panel>
      ) : null}

      <Panel title="Local profile">
        <p className="text-sm">
          Local single-user profile — no hosted identity or medical records.
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Request-integrity sessions use HttpOnly cookies + CSRF tokens for mutations.
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Portable backups exclude secrets, absolute paths, and restricted platform text.
        </p>
      </Panel>

      <Panel title="Browser notifications">
        <p className="text-sm text-[var(--muted)]">
          While-page-open only. No source body text in test notifications.
        </p>
        <p className="text-xs text-[var(--muted)]">Browser permission: {perm}</p>
        <p className="text-xs text-[var(--muted)]">
          App preference (Live profile): {notifPref ? 'enabled' : 'disabled'}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className={btnClass}
            onClick={async () => {
              if (typeof Notification === 'undefined') {
                setMessage('Notifications API unavailable.');
                return;
              }
              const result = await Notification.requestPermission();
              setPerm(result);
              if (result === 'granted') {
                await m6Api.setPreference('browserNotifications', true);
                setNotifPref(true);
              }
            }}
          >
            Opt in (user gesture)
          </button>
          <button
            type="button"
            className={btnClass}
            onClick={() => {
              if (
                !notifPref ||
                typeof Notification === 'undefined' ||
                Notification.permission !== 'granted'
              ) {
                setMessage('Enable app preference and browser permission first.');
                return;
              }
              new Notification('Healthspan Dashboard', {
                body: 'Test notification (no source text).',
              });
            }}
          >
            Test notification
          </button>
          <button
            type="button"
            className={btnClass}
            onClick={() =>
              void m6Api.setPreference('browserNotifications', false).then(() => {
                setNotifPref(false);
                setMessage(
                  'App preference revoked via Live profile API. Revoke browser-level permission in your browser settings (site permissions / notifications).',
                );
              })
            }
          >
            Revoke app preference
          </button>
        </div>
        {message ? <p className="mt-2 text-sm text-[var(--muted)]">{message}</p> : null}
      </Panel>
    </div>
  );
}

export function BriefingsSettingsPage() {
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void m6Api.briefingSettings().then((r) => setSettings(r.settings));
  }, []);

  async function patch(patch: Record<string, unknown>) {
    try {
      const r = await m6Api.updateBriefingSettings(patch);
      setSettings((r as { settings: Record<string, unknown> }).settings);
    } catch (e) {
      setError(String(e));
    }
  }

  if (!settings) return <SkeletonBlock className="h-48 w-full" />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Briefing settings"
        description="Daily/weekly schedule toggles for the local profile."
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Panel title="Schedule">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            Timezone
            <input
              className={`mt-1 w-full ${inputClass}`}
              value={String(settings.timezone ?? '')}
              onChange={(e) => void patch({ timezone: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            Daily time (local)
            <input
              className={`mt-1 w-full ${inputClass}`}
              value={String(settings.dailyTimeLocal ?? '')}
              onChange={(e) => void patch({ dailyTimeLocal: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            Weekly time (local)
            <input
              className={`mt-1 w-full ${inputClass}`}
              value={String(settings.weeklyTimeLocal ?? '')}
              onChange={(e) => void patch({ weeklyTimeLocal: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            Weekly weekday
            <select
              className={`mt-1 w-full ${inputClass}`}
              value={Number(settings.weeklyWeekday ?? 0)}
              onChange={(e) => void patch({ weeklyWeekday: Number(e.target.value) })}
            >
              {WEEKDAYS.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Max daily items
            <input
              type="number"
              className={`mt-1 w-full ${inputClass}`}
              value={Number(settings.maxDailyItems ?? 20)}
              onChange={(e) => void patch({ maxDailyItems: Number(e.target.value) })}
            />
          </label>
          <label className="block text-sm">
            Max weekly items
            <input
              type="number"
              className={`mt-1 w-full ${inputClass}`}
              value={Number(settings.maxWeeklyItems ?? 40)}
              onChange={(e) => void patch({ maxWeeklyItems: Number(e.target.value) })}
            />
          </label>
        </div>
        <div className="mt-3 space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(settings.dailyEnabled)}
              onChange={(e) => void patch({ dailyEnabled: e.target.checked })}
            />
            Daily briefs enabled
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(settings.weeklyEnabled)}
              onChange={(e) => void patch({ weeklyEnabled: e.target.checked })}
            />
            Weekly briefs enabled
          </label>
        </div>
      </Panel>
    </div>
  );
}

export function AlertsSettingsPage() {
  const [rules, setRules] = useState<Array<Record<string, unknown>>>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    targetType: 'watchlist',
    targetRef: '',
    eventKinds: '',
    family: 'research',
    enabled: true,
  });
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const res = await m6Api.listAlertRules();
    setRules(res.items ?? []);
  }

  useEffect(() => {
    void reload().catch((e) => setError(String(e)));
  }, []);

  function resetForm() {
    setEditing(null);
    setForm({
      name: '',
      targetType: 'watchlist',
      targetRef: '',
      eventKinds: '',
      family: 'research',
      enabled: true,
    });
  }

  function loadRule(rule: Record<string, unknown>) {
    const sev = parseJsonField(rule.severityJson);
    setEditing(String(rule.id));
    setForm({
      name: String(rule.name),
      targetType: String(rule.targetType),
      targetRef: String(rule.targetRef ?? ''),
      eventKinds: (JSON.parse(String(rule.eventKindsJson ?? '[]')) as string[]).join(', '),
      family: String(sev.family ?? 'research'),
      enabled: Boolean(rule.enabled),
    });
  }

  async function saveRule() {
    const body = {
      name: form.name.trim(),
      targetType: form.targetType,
      targetRef: form.targetRef.trim() || null,
      eventKinds: parseCsv(form.eventKinds),
      family: form.family,
      enabled: form.enabled,
    };
    try {
      if (editing) await m6Api.updateAlertRule(editing, body);
      else await m6Api.createAlertRule(body);
      resetForm();
      await reload();
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Alert settings"
        description="Deterministic local alert rules — configure evaluation targets and event kinds."
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Panel title={editing ? 'Edit rule' : 'New rule'}>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            className={inputClass}
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            aria-label="Rule name"
          />
          <select
            className={inputClass}
            value={form.targetType}
            onChange={(e) => setForm((f) => ({ ...f, targetType: e.target.value }))}
            aria-label="Target type"
          >
            {ALERT_RULE_TARGETS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            className={inputClass}
            placeholder="Target ref (optional)"
            value={form.targetRef}
            onChange={(e) => setForm((f) => ({ ...f, targetRef: e.target.value }))}
            aria-label="Target ref"
          />
          <select
            className={inputClass}
            value={form.family}
            onChange={(e) => setForm((f) => ({ ...f, family: e.target.value }))}
            aria-label="Family"
          >
            <option value="research">research</option>
            <option value="operational">operational</option>
          </select>
          <input
            className={`sm:col-span-2 ${inputClass}`}
            placeholder="Event kinds (comma-separated)"
            value={form.eventKinds}
            onChange={(e) => setForm((f) => ({ ...f, eventKinds: e.target.value }))}
            aria-label="Event kinds"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
            />
            Enabled
          </label>
        </div>
        <div className="mt-3 flex gap-2">
          <button type="button" className={btnClass} onClick={() => void saveRule()}>
            {editing ? 'Update rule' : 'Create rule'}
          </button>
          {editing ? (
            <button type="button" className={btnClass} onClick={resetForm}>
              Cancel
            </button>
          ) : null}
        </div>
      </Panel>

      <Panel title="Rules">
        {rules.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No alert rules yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {rules.map((r) => {
              const sev = parseJsonField(r.severityJson);
              return (
                <li
                  key={String(r.id)}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-[var(--border)] p-2"
                >
                  <div>
                    <p className="font-medium">
                      {String(r.name)}{' '}
                      {!r.enabled ? (
                        <span className="text-xs text-[var(--muted)]">(disabled)</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {String(r.targetType)}
                      {r.targetRef ? ` · ${String(r.targetRef)}` : ''} ·{' '}
                      {String(sev.family ?? 'research')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="text-xs underline" onClick={() => loadRule(r)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-xs text-rose-600 underline"
                      onClick={() => {
                        if (!window.confirm(`Delete rule “${String(r.name)}”?`)) return;
                        void m6Api.deleteAlertRule(String(r.id)).then(reload);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Link className="text-sm underline" to="/alerts">
        Open Alert Centre
      </Link>
    </div>
  );
}
