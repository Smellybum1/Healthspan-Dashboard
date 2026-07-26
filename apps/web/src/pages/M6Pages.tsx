import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
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
  'database_integrity',
] as const;

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TAXONOMY = {
  source: ['pubmed', 'clinicaltrials', 'tga', 'fda', 'who', 'ema', 'manual'],
  contentType: ['paper', 'trial', 'intervention', 'peptide', 'creator', 'safety_notice', 'claim'],
  entityTypes: ['paper', 'trial', 'intervention', 'peptide', 'creator', 'content_item', 'claim'],
  studyDesign: [
    'rct',
    'observational',
    'meta_analysis',
    'systematic_review',
    'in_vitro',
    'animal',
    'case_report',
  ],
  evidenceMaturity: ['strong', 'moderate', 'emerging', 'preliminary', 'insufficient'],
  evidenceAvailability: ['full_text', 'abstract', 'registry_only', 'summary', 'unavailable'],
  organism: ['human', 'mouse', 'rat', 'nonhuman_primate', 'in_vitro', 'other'],
  population: ['healthy_adults', 'older_adults', 'clinical', 'athletic', 'mixed', 'unknown'],
  outcomeFamily: [
    'longevity',
    'metabolic',
    'cognitive',
    'cardiovascular',
    'musculoskeletal',
    'safety',
    'other',
  ],
  translationGap: ['none', 'narrow', 'moderate', 'wide', 'unknown'],
  trialStatus: ['recruiting', 'active', 'completed', 'terminated', 'withdrawn', 'unknown'],
  regulatoryStanding: [
    'approved',
    'cleared',
    'investigational',
    'compounding',
    'unapproved',
    'withdrawn',
  ],
  creatorClaimFinding: ['supported', 'partial', 'unsupported', 'insufficient', 'retracted'],
  sort: ['newest', 'oldest', 'importance'] as const,
  alertPriority: ['low', 'medium', 'high', 'critical'] as const,
  alertEventFamily: [
    'watchlist_change',
    'saved_search_match',
    'official_safety',
    'database_integrity',
    'source_health',
    'regulatory',
    'research',
  ],
  muteScopes: ['object', 'topic', 'source', 'event_type', 'watchable'] as const,
  briefingSections: [
    'urgent_alerts',
    'since_last_visit',
    'watchlist_changes',
    'saved_search_matches',
    'continue_reading',
    'daily_brief',
    'source_coverage',
  ] as const,
};

type SavedSearchQueryV2 = {
  searchSchemaVersion: 2;
  textQuery?: string;
  entityTypes?: string[];
  filters?: {
    source?: string[];
    contentType?: string[];
    studyDesign?: string[];
    evidenceMaturity?: string[];
    evidenceAvailability?: string[];
    organism?: string[];
    population?: string[];
    outcomeFamily?: string[];
    translationGap?: string[];
    trialStatus?: string[];
    regulatoryStanding?: string[];
    safetyItemPresent?: boolean;
    intervention?: string[];
    peptide?: string[];
    creator?: string[];
    creatorClaimFinding?: string[];
  };
  dateRange?: { from?: string; to?: string };
  sort?: 'newest' | 'oldest' | 'importance';
  includeRetracted?: boolean;
  includeUnavailable?: boolean;
};

const FLOOR_LOCKED_TARGETS = new Set(['all_official_safety', 'database_integrity']);
const PRIORITY_RANK: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };

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

function parseQueryFromItem(raw: unknown): SavedSearchQueryV2 {
  const parsed = parseJsonField(raw);
  const filters = (parsed.filters as SavedSearchQueryV2['filters']) ?? {};
  return {
    searchSchemaVersion: 2,
    textQuery: String(parsed.textQuery ?? parsed.text ?? ''),
    entityTypes: (parsed.entityTypes as string[]) ?? (parsed.targetTypes as string[]) ?? [],
    filters: {
      source: filters.source ?? (parsed.sources as string[]) ?? [],
      contentType: filters.contentType ?? [],
      studyDesign: filters.studyDesign ?? [],
      evidenceMaturity: filters.evidenceMaturity ?? [],
      evidenceAvailability: filters.evidenceAvailability ?? [],
      organism: filters.organism ?? [],
      population: filters.population ?? [],
      outcomeFamily: filters.outcomeFamily ?? [],
      translationGap: filters.translationGap ?? [],
      trialStatus: filters.trialStatus ?? [],
      regulatoryStanding: filters.regulatoryStanding ?? [],
      safetyItemPresent: filters.safetyItemPresent,
      intervention: filters.intervention ?? [],
      peptide: filters.peptide ?? [],
      creator: filters.creator ?? [],
      creatorClaimFinding: filters.creatorClaimFinding ?? [],
    },
    dateRange: (parsed.dateRange as SavedSearchQueryV2['dateRange']) ?? {},
    sort: (parsed.sort as SavedSearchQueryV2['sort']) ?? 'newest',
    includeRetracted: Boolean(parsed.includeRetracted),
    includeUnavailable: Boolean(parsed.includeUnavailable),
  };
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
    <section className="card">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="t-section">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

function HealthBadge({ status }: { status: string }) {
  const tone =
    status === 'healthy' || status === 'ok'
      ? 'text-[var(--tone-ok-fg)]'
      : status === 'degraded' || status === 'warn'
        ? 'text-[var(--tone-watch-fg)]'
        : 'text-[var(--tone-flag-fg)]';
  return (
    <span className={`rounded-full border border-[var(--border)] px-2 py-0.5 text-xs ${tone}`}>
      {status}
    </span>
  );
}

function AvailabilityBadge({
  availability,
  redirectedTo,
  targetType,
}: {
  availability?: string;
  redirectedTo?: string | null;
  targetType?: string;
}) {
  if (!availability || availability === 'available') return null;
  const tone =
    availability === 'redirected' ? 'text-[var(--tone-watch-fg)]' : 'text-[var(--tone-flag-fg)]';
  const href =
    availability === 'redirected' && redirectedTo
      ? itemPath(String(targetType || 'content_item'), String(redirectedTo))
      : null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span className={`rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] uppercase ${tone}`}>
        {availability}
      </span>
      {href ? (
        <Link className="text-[10px] underline" to={href}>
          Open replacement ({String(redirectedTo)})
        </Link>
      ) : null}
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
          <dd>
            {k.toLowerCase().includes('link') || k.toLowerCase().includes('url') ? (
              <a className="underline" href={String(v)} target="_blank" rel="noreferrer">
                {String(v)}
              </a>
            ) : typeof v === 'string' ? (
              v
            ) : (
              JSON.stringify(v)
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function MultiSelectCheckboxes({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: readonly string[];
  values: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <fieldset className="rounded-lg border border-[var(--border)] p-2">
      <legend className="px-1 text-xs font-medium text-[var(--muted)]">{label}</legend>
      <div className="flex max-h-36 flex-wrap gap-x-3 gap-y-1 overflow-auto text-xs">
        {options.map((opt) => {
          const checked = values.includes(opt);
          return (
            <label key={opt} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => {
                  if (e.target.checked) onChange([...values, opt]);
                  else onChange(values.filter((v) => v !== opt));
                }}
              />
              {opt}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function TagListInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');
  return (
    <label className="block text-sm">
      {label}
      <div className="mt-1 flex flex-wrap gap-1">
        {values.map((v) => (
          <button
            key={v}
            type="button"
            className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-xs"
            onClick={() => onChange(values.filter((x) => x !== v))}
          >
            {v} ×
          </button>
        ))}
      </div>
      <input
        className={`mt-1 w-full ${inputClass}`}
        value={draft}
        placeholder={placeholder ?? 'Type value and press Enter'}
        aria-label={label}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          const next = draft.trim();
          if (!next || values.includes(next)) return;
          onChange([...values, next]);
          setDraft('');
        }}
      />
    </label>
  );
}

function SavedSearchQueryPreview({ query }: { query: SavedSearchQueryV2 }) {
  const rows: Array<[string, string]> = [
    ['Text', query.textQuery?.trim() || '—'],
    ['Entity types', joinCsv(query.entityTypes) || '—'],
    ['Source', joinCsv(query.filters?.source) || '—'],
    ['Content type', joinCsv(query.filters?.contentType) || '—'],
    ['Study design', joinCsv(query.filters?.studyDesign) || '—'],
    ['Evidence maturity', joinCsv(query.filters?.evidenceMaturity) || '—'],
    ['Evidence availability', joinCsv(query.filters?.evidenceAvailability) || '—'],
    ['Organism', joinCsv(query.filters?.organism) || '—'],
    ['Population', joinCsv(query.filters?.population) || '—'],
    ['Outcome family', joinCsv(query.filters?.outcomeFamily) || '—'],
    ['Translation gap', joinCsv(query.filters?.translationGap) || '—'],
    ['Trial status', joinCsv(query.filters?.trialStatus) || '—'],
    ['Regulatory standing', joinCsv(query.filters?.regulatoryStanding) || '—'],
    [
      'Safety item present',
      query.filters?.safetyItemPresent === undefined
        ? '—'
        : query.filters.safetyItemPresent
          ? 'yes'
          : 'no',
    ],
    ['Intervention', joinCsv(query.filters?.intervention) || '—'],
    ['Peptide', joinCsv(query.filters?.peptide) || '—'],
    ['Creator', joinCsv(query.filters?.creator) || '—'],
    ['Creator-claim finding', joinCsv(query.filters?.creatorClaimFinding) || '—'],
    ['Date from', query.dateRange?.from || '—'],
    ['Date to', query.dateRange?.to || '—'],
    ['Sort', query.sort ?? 'newest'],
    ['Include retracted', query.includeRetracted ? 'yes' : 'no'],
    ['Include unavailable', query.includeUnavailable ? 'yes' : 'no'],
  ];
  return (
    <dl className="grid gap-1 text-xs sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k} className="flex flex-wrap gap-1">
          <dt className="font-medium text-[var(--muted)]">{k}:</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function StatusDl({ entries }: { entries: Array<[string, unknown]> }) {
  return (
    <dl className="space-y-1 text-sm">
      {entries.map(([k, v]) => (
        <div key={k} className="flex flex-wrap justify-between gap-2">
          <dt className="text-[var(--muted)]">{k}</dt>
          <dd>{v == null || v === '' ? '—' : typeof v === 'string' ? v : JSON.stringify(v)}</dd>
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
  const [entriesTotal, setEntriesTotal] = useState(0);
  const [entriesPage, setEntriesPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [changes, setChanges] = useState<Array<Record<string, unknown>>>([]);
  const [changesTotal, setChangesTotal] = useState(0);
  const [changesPage, setChangesPage] = useState(1);
  const [targetId, setTargetId] = useState('');
  const [targetType, setTargetType] = useState('content_item');
  const [batchText, setBatchText] = useState('');
  const [filterType, setFilterType] = useState('');
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const loadEntries = useCallback(
    async (watchlistId: string) => {
      const r = await m6Api.getWatchlist(watchlistId, {
        targetType: filterType || undefined,
        page: entriesPage,
        pageSize,
      });
      setEntries(r.items ?? r.entries ?? []);
      setEntriesTotal(Number(r.total ?? (r.items ?? []).length));
      const ch = await m6Api.watchlistChanges(watchlistId, {
        page: changesPage,
        pageSize,
      });
      setChanges(ch.items ?? []);
      setChangesTotal(Number(ch.total ?? (ch.items ?? []).length));
    },
    [filterType, entriesPage, changesPage, pageSize],
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

  async function batchAdd() {
    if (!selected) return;
    const lines = batchText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const actions = lines.map((line) => {
      const parts = line.split(':');
      const typePart = parts[0] ?? '';
      const idPart = parts.slice(1).join(':').trim();
      if (parts.length < 2 || !idPart) {
        return {
          op: 'add' as const,
          targetType,
          targetId: typePart.trim(),
          displayTitle: typePart.trim(),
        };
      }
      return {
        op: 'add' as const,
        targetType: typePart.trim() || targetType,
        targetId: idPart,
        displayTitle: idPart,
      };
    });
    if (actions.length === 0) return;
    await m6Api.batchWatchlistItems(selected, actions);
    setBatchText('');
    await loadEntries(selected);
  }

  const entriesPageCount = Math.max(1, Math.ceil(entriesTotal / pageSize));
  const changesPageCount = Math.max(1, Math.ceil(changesTotal / pageSize));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Watchlists"
        description="Named Live watchlists persist in SQLite. Demo follow state remains browser-local."
      />
      {mode === 'demo' ? <DemoBanner notice={DEMO_SNAPSHOT_NOTICE} /> : null}
      {error ? <p className="text-sm text-[var(--tone-flag-fg)]">{error}</p> : null}

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
            <label className="flex items-center gap-2 text-sm">
              Page size
              <select
                className={btnSmClass}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setEntriesPage(1);
                  setChangesPage(1);
                }}
                aria-label="Page size"
              >
                {[10, 25, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
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
                          <span className="text-[10px] uppercase text-[var(--tone-watch-fg)]">
                            archived
                          </span>
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
                            className="text-[var(--tone-flag-fg)] underline"
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
              {selectedList ? (
                <div className="mb-3 flex flex-wrap gap-3 text-xs">
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedList.alertEnabled)}
                      onChange={(e) =>
                        void m6Api
                          .updateWatchlistSettings(String(selectedList.id), {
                            alertEnabled: e.target.checked,
                          })
                          .then(reload)
                      }
                    />
                    List alerts
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedList.briefEnabled)}
                      onChange={(e) =>
                        void m6Api
                          .updateWatchlistSettings(String(selectedList.id), {
                            briefEnabled: e.target.checked,
                          })
                          .then(reload)
                      }
                    />
                    List briefs
                  </label>
                </div>
              ) : null}
              <div className="mb-2 flex flex-wrap gap-2">
                <select
                  className={btnSmClass}
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    setEntriesPage(1);
                  }}
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
              <div className="mt-3 space-y-2">
                <label className="block text-xs text-[var(--muted)]">
                  Batch add (one `targetType:targetId` per line, or bare IDs using type above)
                  <textarea
                    className={`mt-1 min-h-20 w-full font-mono text-xs ${inputClass}`}
                    value={batchText}
                    onChange={(e) => setBatchText(e.target.value)}
                    aria-label="Batch add targets"
                  />
                </label>
                <button
                  type="button"
                  className={btnSmClass}
                  onClick={() => void batchAdd().catch((e) => setError(String(e)))}
                >
                  Batch add
                </button>
              </div>
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
                          <AvailabilityBadge
                            availability={String(w?.availability ?? '')}
                            redirectedTo={w?.redirectedTo != null ? String(w.redirectedTo) : null}
                            targetType={w?.targetType != null ? String(w.targetType) : undefined}
                          />
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
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  className={btnSmClass}
                  disabled={entriesPage <= 1}
                  onClick={() => setEntriesPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <span>
                  Page {entriesPage} / {entriesPageCount} ({entriesTotal} items)
                </span>
                <button
                  type="button"
                  className={btnSmClass}
                  disabled={entriesPage >= entriesPageCount}
                  onClick={() => setEntriesPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
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
                        <AvailabilityBadge
                          availability={String(w?.availability ?? '')}
                          redirectedTo={w?.redirectedTo != null ? String(w.redirectedTo) : null}
                          targetType={w?.targetType != null ? String(w.targetType) : undefined}
                        />
                        <span className="text-xs text-[var(--muted)]">
                          {formatWhen(new Date(Number(c.addedAt)).toISOString())}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  className={btnSmClass}
                  disabled={changesPage <= 1}
                  onClick={() => setChangesPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <span>
                  Page {changesPage} / {changesPageCount} ({changesTotal} changes)
                </span>
                <button
                  type="button"
                  className={btnSmClass}
                  disabled={changesPage >= changesPageCount}
                  onClick={() => setChangesPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
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
    <section className="card">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="t-section">Demo followed items ({prefs.followedIds.length})</h2>
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
  filters: {
    source: [],
    contentType: [],
    studyDesign: [],
    evidenceMaturity: [],
    evidenceAvailability: [],
    organism: [],
    population: [],
    outcomeFamily: [],
    translationGap: [],
    trialStatus: [],
    regulatoryStanding: [],
    safetyItemPresent: undefined,
    intervention: [],
    peptide: [],
    creator: [],
    creatorClaimFinding: [],
  },
  dateRange: {},
  sort: 'newest',
  includeRetracted: false,
  includeUnavailable: false,
});

function SavedSearchBuilderFields({
  query,
  setQuery,
}: {
  query: SavedSearchQueryV2;
  setQuery: (updater: (q: SavedSearchQueryV2) => SavedSearchQueryV2) => void;
}) {
  const setFilter = (key: keyof NonNullable<SavedSearchQueryV2['filters']>, values: string[]) => {
    setQuery((q) => ({ ...q, filters: { ...q.filters, [key]: values } }));
  };
  return (
    <div className="space-y-3">
      <input
        className={`w-full ${inputClass}`}
        placeholder="Text query"
        value={query.textQuery ?? ''}
        onChange={(ev) => setQuery((q) => ({ ...q, textQuery: ev.target.value }))}
        aria-label="Text query"
      />
      <MultiSelectCheckboxes
        label="Entity types / content types"
        options={TAXONOMY.entityTypes}
        values={query.entityTypes ?? []}
        onChange={(next) => setQuery((q) => ({ ...q, entityTypes: next }))}
      />
      <div className="grid gap-2 lg:grid-cols-2">
        <MultiSelectCheckboxes
          label="Source"
          options={TAXONOMY.source}
          values={query.filters?.source ?? []}
          onChange={(next) => setFilter('source', next)}
        />
        <MultiSelectCheckboxes
          label="Content type"
          options={TAXONOMY.contentType}
          values={query.filters?.contentType ?? []}
          onChange={(next) => setFilter('contentType', next)}
        />
        <MultiSelectCheckboxes
          label="Study design"
          options={TAXONOMY.studyDesign}
          values={query.filters?.studyDesign ?? []}
          onChange={(next) => setFilter('studyDesign', next)}
        />
        <MultiSelectCheckboxes
          label="Evidence maturity"
          options={TAXONOMY.evidenceMaturity}
          values={query.filters?.evidenceMaturity ?? []}
          onChange={(next) => setFilter('evidenceMaturity', next)}
        />
        <MultiSelectCheckboxes
          label="Evidence availability"
          options={TAXONOMY.evidenceAvailability}
          values={query.filters?.evidenceAvailability ?? []}
          onChange={(next) => setFilter('evidenceAvailability', next)}
        />
        <MultiSelectCheckboxes
          label="Organism"
          options={TAXONOMY.organism}
          values={query.filters?.organism ?? []}
          onChange={(next) => setFilter('organism', next)}
        />
        <MultiSelectCheckboxes
          label="Population"
          options={TAXONOMY.population}
          values={query.filters?.population ?? []}
          onChange={(next) => setFilter('population', next)}
        />
        <MultiSelectCheckboxes
          label="Outcome family"
          options={TAXONOMY.outcomeFamily}
          values={query.filters?.outcomeFamily ?? []}
          onChange={(next) => setFilter('outcomeFamily', next)}
        />
        <MultiSelectCheckboxes
          label="Translation gap"
          options={TAXONOMY.translationGap}
          values={query.filters?.translationGap ?? []}
          onChange={(next) => setFilter('translationGap', next)}
        />
        <MultiSelectCheckboxes
          label="Trial status"
          options={TAXONOMY.trialStatus}
          values={query.filters?.trialStatus ?? []}
          onChange={(next) => setFilter('trialStatus', next)}
        />
        <MultiSelectCheckboxes
          label="Regulatory standing"
          options={TAXONOMY.regulatoryStanding}
          values={query.filters?.regulatoryStanding ?? []}
          onChange={(next) => setFilter('regulatoryStanding', next)}
        />
        <MultiSelectCheckboxes
          label="Creator-claim finding"
          options={TAXONOMY.creatorClaimFinding}
          values={query.filters?.creatorClaimFinding ?? []}
          onChange={(next) => setFilter('creatorClaimFinding', next)}
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <TagListInput
          label="Intervention IDs"
          values={query.filters?.intervention ?? []}
          onChange={(next) => setFilter('intervention', next)}
        />
        <TagListInput
          label="Peptide IDs"
          values={query.filters?.peptide ?? []}
          onChange={(next) => setFilter('peptide', next)}
        />
        <TagListInput
          label="Creator IDs"
          values={query.filters?.creator ?? []}
          onChange={(next) => setFilter('creator', next)}
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="block text-sm">
          Date from
          <input
            type="date"
            className={`mt-1 w-full ${inputClass}`}
            value={query.dateRange?.from?.slice(0, 10) ?? ''}
            onChange={(e) =>
              setQuery((q) => ({
                ...q,
                dateRange: { ...q.dateRange, from: e.target.value || undefined },
              }))
            }
          />
        </label>
        <label className="block text-sm">
          Date to
          <input
            type="date"
            className={`mt-1 w-full ${inputClass}`}
            value={query.dateRange?.to?.slice(0, 10) ?? ''}
            onChange={(e) =>
              setQuery((q) => ({
                ...q,
                dateRange: { ...q.dateRange, to: e.target.value || undefined },
              }))
            }
          />
        </label>
        <label className="block text-sm">
          Sort
          <select
            className={`mt-1 w-full ${inputClass}`}
            value={query.sort ?? 'newest'}
            onChange={(e) =>
              setQuery((q) => ({
                ...q,
                sort: e.target.value as SavedSearchQueryV2['sort'],
              }))
            }
            aria-label="Sort"
          >
            {TAXONOMY.sort.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={query.filters?.safetyItemPresent === true}
            onChange={(e) =>
              setQuery((q) => ({
                ...q,
                filters: {
                  ...q.filters,
                  safetyItemPresent: e.target.checked ? true : undefined,
                },
              }))
            }
          />
          Official safety item present
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(query.includeRetracted)}
            onChange={(e) => setQuery((q) => ({ ...q, includeRetracted: e.target.checked }))}
          />
          Include retracted
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(query.includeUnavailable)}
            onChange={(e) => setQuery((q) => ({ ...q, includeUnavailable: e.target.checked }))}
          />
          Include unavailable
        </label>
      </div>
    </div>
  );
}

export function SavedSearchesPage() {
  const mode = useLiveMode();
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [name, setName] = useState('');
  const [query, setQuery] = useState<SavedSearchQueryV2>(emptySearchQuery);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
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

  function loadIntoBuilder(item: Record<string, unknown>) {
    setEditingId(String(item.id));
    setName(String(item.name ?? ''));
    setQuery(parseQueryFromItem(item.queryJson));
    setShowPreview(true);
  }

  async function saveSearch(e: FormEvent) {
    e.preventDefault();
    const payload = {
      ...query,
      textQuery: query.textQuery?.trim() || undefined,
    };
    try {
      if (editingId) {
        await m6Api.updateSavedSearch(editingId, {
          name: name.trim() || 'Untitled search',
          query: payload,
          needsUpdate: false,
        });
      } else {
        await m6Api.createSavedSearch(name.trim() || 'Untitled search', payload);
      }
      setName('');
      setQuery(emptySearchQuery());
      setEditingId(null);
      setShowPreview(false);
      await reload();
    } catch (err) {
      setError(String(err));
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Saved Searches"
        description="Structured filter builder — no browser SQL or regular expressions."
      />
      {mode === 'demo' ? <DemoBanner notice={DEMO_SNAPSHOT_NOTICE} /> : null}
      {error ? <p className="text-sm text-[var(--tone-flag-fg)]">{error}</p> : null}
      {mode === 'live' ? (
        <>
          <form className="space-y-3 card" onSubmit={(e) => void saveSearch(e)}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="t-section">
                {editingId ? 'Edit search (schema v2)' : 'Builder (schema v2)'}
              </h2>
              {editingId ? (
                <button
                  type="button"
                  className={btnSmClass}
                  onClick={() => {
                    setEditingId(null);
                    setName('');
                    setQuery(emptySearchQuery());
                    setShowPreview(false);
                  }}
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
            <input
              className={`w-full ${inputClass}`}
              placeholder="Name"
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              aria-label="Saved search name"
            />
            <SavedSearchBuilderFields query={query} setQuery={setQuery} />
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btnClass} onClick={() => setShowPreview((v) => !v)}>
                {showPreview ? 'Hide preview' : 'Preview before save'}
              </button>
              <button type="submit" className={btnClass}>
                {editingId ? 'Update search' : 'Save search'}
              </button>
            </div>
            {showPreview ? (
              <Panel title="Query preview">
                <SavedSearchQueryPreview query={query} />
              </Panel>
            ) : null}
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
                        <span className="rounded bg-[var(--tone-watch-bg)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--tone-watch-fg)]">
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
                        onClick={() => loadIntoBuilder(s)}
                      >
                        Edit
                      </button>
                      {s.needsUpdate ? (
                        <button
                          type="button"
                          className="underline text-[var(--tone-watch-fg)]"
                          onClick={() => {
                            loadIntoBuilder(s);
                            setShowPreview(true);
                          }}
                        >
                          Repair query
                        </button>
                      ) : null}
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
                        className="text-[var(--tone-flag-fg)] underline"
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
  const mode = useLiveMode();
  const [item, setItem] = useState<Record<string, unknown> | null>(null);
  const [matches, setMatches] = useState<Array<Record<string, unknown>>>([]);
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [query, setQuery] = useState<SavedSearchQueryV2>(emptySearchQuery);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const [detail, matchRes, histRes] = await Promise.all([
      m6Api.getSavedSearch(id),
      m6Api.savedSearchMatches(id),
      m6Api.savedSearchHistory(id),
    ]);
    setItem(detail.item);
    setName(String(detail.item.name ?? ''));
    setQuery(parseQueryFromItem(detail.item.queryJson));
    setMatches(matchRes.items ?? []);
    setHistory(histRes.items ?? []);
  }

  useEffect(() => {
    void reload().catch((e) => setError(String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function saveEdits() {
    try {
      await m6Api.updateSavedSearch(id, {
        name: name.trim() || 'Untitled search',
        query: { ...query, textQuery: query.textQuery?.trim() || undefined },
        needsUpdate: false,
      });
      setEditing(false);
      await reload();
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={String(item?.name ?? 'Saved search')}
        description="Structured saved search detail"
      />
      {mode === 'demo' ? <DemoBanner notice={DEMO_SNAPSHOT_NOTICE} /> : null}
      {error ? <p className="text-sm text-[var(--tone-flag-fg)]">{error}</p> : null}
      {item?.needsUpdate ? (
        <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--tone-watch-fg)]">
          <p>This search was migrated and may need review.</p>
          <button
            type="button"
            className={btnSmClass}
            onClick={() => {
              setEditing(true);
              setQuery(parseQueryFromItem(item.queryJson));
            }}
          >
            Review & repair
          </button>
        </div>
      ) : null}

      {editing ? (
        <Panel
          title="Edit query"
          actions={
            <div className="flex gap-2">
              <button type="button" className={btnSmClass} onClick={() => void saveEdits()}>
                Save update
              </button>
              <button type="button" className={btnSmClass} onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          }
        >
          <input
            className={`mb-3 w-full ${inputClass}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Saved search name"
          />
          <SavedSearchBuilderFields query={query} setQuery={setQuery} />
          <div className="mt-3">
            <SavedSearchQueryPreview query={query} />
          </div>
        </Panel>
      ) : (
        <Panel
          title="Query"
          actions={
            <button type="button" className={btnSmClass} onClick={() => setEditing(true)}>
              Edit
            </button>
          }
        >
          <SavedSearchQueryPreview query={query} />
        </Panel>
      )}

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

      <Panel title="Evaluation history">
        {history.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No evaluation history yet.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {history.map((h) => (
              <li key={String(h.id)}>
                {formatWhen(new Date(Number(h.completedAt ?? h.startedAt)).toISOString())} —{' '}
                {String(h.status)} · matched {String(h.matchedCount)} · new {String(h.newCount)}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="flex flex-wrap gap-3 text-sm">
        <button
          type="button"
          className={btnClass}
          onClick={() =>
            void m6Api
              .runSavedSearch(id)
              .then(reload)
              .catch((e) => setError(String(e)))
          }
        >
          Run now
        </button>
        <Link className="underline" to="/saved-searches">
          Back to saved searches
        </Link>
      </div>
    </div>
  );
}

export function AlertsPage() {
  const mode = useLiveMode();
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [stateFilter, setStateFilter] = useState('all');
  const [familyFilter, setFamilyFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [watchlistFilter, setWatchlistFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [snoozeHours, setSnoozeHours] = useState('4');
  const [snoozeUntilLocal, setSnoozeUntilLocal] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    await m6Api.evaluateAlerts().catch(() => undefined);
    const res = await m6Api.listAlerts({
      state: stateFilter === 'all' ? undefined : stateFilter,
      family: familyFilter === 'all' ? undefined : familyFilter,
      priority: priorityFilter === 'all' ? undefined : priorityFilter,
      source: sourceFilter === 'all' ? undefined : sourceFilter,
      eventKind: eventFilter === 'all' ? undefined : eventFilter,
      watchlistId: watchlistFilter.trim() || undefined,
      savedSearchId: searchFilter.trim() || undefined,
    });
    setItems(res.items);
    setSelected(new Set());
  }

  useEffect(() => {
    if (mode !== 'live') return;
    void reload().catch((e) => setError(String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, stateFilter, familyFilter, priorityFilter, sourceFilter, eventFilter]);

  function snoozePayload() {
    if (snoozeUntilLocal) {
      const ms = new Date(snoozeUntilLocal).getTime();
      if (!Number.isNaN(ms)) return { snoozeUntil: ms };
    }
    const hours = Number(snoozeHours) || 4;
    return { snoozeUntil: Date.now() + hours * 3600_000 };
  }

  async function batchAction(action: 'read' | 'acknowledge' | 'dismiss' | 'resolve') {
    if (selected.size === 0) return;
    const actions = [...selected].map((alertId) => ({ alertId, action }));
    await m6Api.batchAlerts(actions);
    await reload();
  }

  const researchItems = items.filter((a) => String(a.family ?? 'research') !== 'operational');
  const operationalItems = items.filter((a) => String(a.family) === 'operational');

  function renderAlertList(list: Array<Record<string, unknown>>, title: string) {
    if (list.length === 0) return null;
    return (
      <Panel title={title}>
        <ul className="divide-y divide-[var(--border)]">
          {list.map((a) => {
            const aid = String(a.id);
            const why = a.whyIncluded ?? parseJsonField(a.whyIncludedJson);
            const whyObj = why as Record<string, unknown>;
            return (
              <li key={aid} className="space-y-2 py-3 text-sm">
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
                        {String(a.family ?? 'research')} · {String(a.importance)} ·{' '}
                        {String(a.state)} · detected{' '}
                        {formatWhen(new Date(Number(a.createdAt ?? a.occurredAt)).toISOString())}
                        {a.occurredAt ? (
                          <> · source {formatWhen(new Date(Number(a.occurredAt)).toISOString())}</>
                        ) : null}
                      </p>
                    </div>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ['read', 'Read'],
                        ['acknowledge', 'Ack'],
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
                            .alertAction(aid, action)
                            .then(reload)
                            .catch((e) => setError(String(e)))
                        }
                      >
                        {label}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="text-xs underline"
                      onClick={() =>
                        void m6Api
                          .alertAction(aid, 'snooze', snoozePayload())
                          .then(reload)
                          .catch((e) => setError(String(e)))
                      }
                    >
                      Snooze
                    </button>
                    <button
                      type="button"
                      className="text-xs underline"
                      onClick={() =>
                        void m6Api
                          .createMute({
                            scopeType: 'object',
                            scopeId: a.watchableId ? String(a.watchableId) : aid,
                            reason: `muted from alert ${aid}`,
                            scopeEventType: String(a.kind ?? ''),
                          })
                          .then(reload)
                          .catch((e) => setError(String(e)))
                      }
                    >
                      Mute
                    </button>
                  </div>
                </div>
                <details>
                  <summary className="cursor-pointer text-xs text-[var(--muted)]">
                    Why included
                  </summary>
                  <div className="mt-1">
                    <WhyIncludedPreview value={why} />
                    {whyObj.sourceLink || whyObj.sourceUrl ? (
                      <p className="mt-1 text-xs">
                        Source:{' '}
                        <a
                          className="underline"
                          href={String(whyObj.sourceLink ?? whyObj.sourceUrl)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {String(whyObj.sourceLink ?? whyObj.sourceUrl)}
                        </a>
                      </p>
                    ) : null}
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Alert Centre"
        description="Deterministic research/operational alerts — not personal clinical risk."
      />
      {mode === 'demo' ? <DemoBanner notice={DEMO_SNAPSHOT_NOTICE} /> : null}
      {error ? <p className="text-sm text-[var(--tone-flag-fg)]">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <select
          className={btnSmClass}
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          aria-label="State filter"
        >
          {['all', 'new', 'read', 'acknowledged', 'snoozed', 'dismissed', 'resolved'].map((s) => (
            <option key={s} value={s}>
              state: {s}
            </option>
          ))}
        </select>
        <select
          className={btnSmClass}
          value={familyFilter}
          onChange={(e) => setFamilyFilter(e.target.value)}
          aria-label="Family filter"
        >
          {['all', 'research', 'operational'].map((f) => (
            <option key={f} value={f}>
              family: {f}
            </option>
          ))}
        </select>
        <select
          className={btnSmClass}
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          aria-label="Priority filter"
        >
          <option value="all">priority: all</option>
          {TAXONOMY.alertPriority.map((p) => (
            <option key={p} value={p}>
              priority: {p}
            </option>
          ))}
        </select>
        <select
          className={btnSmClass}
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          aria-label="Source filter"
        >
          <option value="all">source: all</option>
          {TAXONOMY.source.map((s) => (
            <option key={s} value={s}>
              source: {s}
            </option>
          ))}
        </select>
        <select
          className={btnSmClass}
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          aria-label="Event family filter"
        >
          <option value="all">event: all</option>
          {TAXONOMY.alertEventFamily.map((s) => (
            <option key={s} value={s}>
              event: {s}
            </option>
          ))}
        </select>
        <input
          className={btnSmClass}
          placeholder="Watchlist id"
          value={watchlistFilter}
          onChange={(e) => setWatchlistFilter(e.target.value)}
          aria-label="Watchlist filter"
        />
        <input
          className={btnSmClass}
          placeholder="Saved search id"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          aria-label="Saved search filter"
        />
        <button type="button" className={btnSmClass} onClick={() => void reload()}>
          Apply filters
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <label className="flex items-center gap-1">
          Snooze hours
          <select
            className={btnSmClass}
            value={snoozeHours}
            onChange={(e) => setSnoozeHours(e.target.value)}
            aria-label="Snooze hours"
          >
            {['1', '4', '8', '24', '72'].map((h) => (
              <option key={h} value={h}>
                {h}h
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1">
          or until
          <input
            type="datetime-local"
            className={btnSmClass}
            value={snoozeUntilLocal}
            onChange={(e) => setSnoozeUntilLocal(e.target.value)}
            aria-label="Snooze until"
          />
        </label>
        {selected.size > 0 ? (
          <>
            <button type="button" className={btnSmClass} onClick={() => void batchAction('read')}>
              Mark read ({selected.size})
            </button>
            <button
              type="button"
              className={btnSmClass}
              onClick={() => void batchAction('acknowledge')}
            >
              Ack selected
            </button>
            <button
              type="button"
              className={btnSmClass}
              onClick={() => void batchAction('dismiss')}
            >
              Dismiss selected
            </button>
            <button
              type="button"
              className={btnSmClass}
              onClick={() => void batchAction('resolve')}
            >
              Resolve selected
            </button>
          </>
        ) : null}
      </div>
      {renderAlertList(operationalItems, 'Operational integrity')}
      {renderAlertList(researchItems, 'Research & safety')}
      {items.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No alerts in this filter.</p>
      ) : null}
    </div>
  );
}

export function AlertDetailPage() {
  const { id = '' } = useParams();
  const [item, setItem] = useState<Record<string, unknown> | null>(null);
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);
  const [snoozeUntilLocal, setSnoozeUntilLocal] = useState('');
  const [error, setError] = useState<string | null>(null);
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
  const why = (item?.whyIncluded ?? parseJsonField(item?.whyIncludedJson)) as Record<
    string,
    unknown
  >;
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
      {error ? <p className="text-sm text-[var(--tone-flag-fg)]">{error}</p> : null}
      <Panel title="Summary">
        <p className="text-sm">
          <strong>State:</strong> {String(item?.state ?? '—')} · <strong>Family:</strong>{' '}
          {String(item?.family ?? severity?.family ?? '—')} · <strong>Importance:</strong>{' '}
          {String(item?.importance ?? '—')}
        </p>
        <p className="mt-2 text-sm">{String(item?.summary ?? '')}</p>
        <dl className="mt-3 grid gap-1 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-[var(--muted)]">Source date</dt>
            <dd>
              {item?.occurredAt
                ? formatWhen(new Date(Number(item.occurredAt)).toISOString())
                : String(why.sourceDate ?? '—')}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Detection date</dt>
            <dd>
              {item?.createdAt
                ? formatWhen(new Date(Number(item.createdAt)).toISOString())
                : String(why.detectionDate ?? '—')}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[var(--muted)]">Source link</dt>
            <dd>
              {why.sourceLink || why.sourceUrl ? (
                <a
                  className="underline"
                  href={String(why.sourceLink ?? why.sourceUrl)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {String(why.sourceLink ?? why.sourceUrl)}
                </a>
              ) : (
                '—'
              )}
            </dd>
          </div>
        </dl>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="datetime-local"
            className={btnSmClass}
            value={snoozeUntilLocal}
            onChange={(e) => setSnoozeUntilLocal(e.target.value)}
            aria-label="Snooze until"
          />
          <button
            type="button"
            className={btnSmClass}
            onClick={() => {
              const ms = snoozeUntilLocal
                ? new Date(snoozeUntilLocal).getTime()
                : Date.now() + 4 * 3600_000;
              void m6Api
                .alertAction(id, 'snooze', { snoozeUntil: ms })
                .then((r) => setItem((r as { item?: Record<string, unknown> }).item ?? item))
                .catch((e) => setError(String(e)));
            }}
          >
            Snooze
          </button>
          <button
            type="button"
            className={btnSmClass}
            onClick={() =>
              void m6Api
                .createMute({
                  scopeType: 'object',
                  scopeId: item?.watchableId ? String(item.watchableId) : id,
                  reason: `muted from alert detail ${id}`,
                })
                .catch((e) => setError(String(e)))
            }
          >
            Mute
          </button>
        </div>
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
      {error ? <p className="text-sm text-[var(--tone-flag-fg)]">{error}</p> : null}

      {status ? (
        <Panel title="Schedule & last runs">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[var(--muted)]">Timezone</dt>
              <dd>{String((schedule as { timezone?: string }).timezone ?? '—')}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Catch-up</dt>
              <dd>{String(status.catchUpPolicy ?? '—')}</dd>
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
            <div>
              <dt className="text-[var(--muted)]">Job state</dt>
              <dd>
                {((status.recentRuns as Array<Record<string, unknown>>) ?? [])[0]
                  ? String(((status.recentRuns as Array<Record<string, unknown>>) ?? [])[0]?.status)
                  : 'idle'}
              </dd>
            </div>
          </dl>
          <Link className="mt-2 inline-block text-xs underline" to="/settings/briefings">
            Open briefing settings
          </Link>
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
  const overflowCount = Number(data?.brief.overflowCount ?? coverage.overflow ?? 0);

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
      {error ? <p className="text-sm text-[var(--tone-flag-fg)]">{error}</p> : null}
      <Panel title="Source coverage">
        <WhyIncludedPreview value={coverage} />
        {((coverage.partialReasons as string[]) ?? []).length > 0 ? (
          <p className="mt-2 text-xs text-[var(--tone-watch-fg)]">
            Partial: {((coverage.partialReasons as string[]) ?? []).join(', ')}
          </p>
        ) : null}
        {overflowCount > 0 ? (
          <p className="mt-2 text-xs">
            Overflow: {overflowCount} additional candidates not shown.{' '}
            <Link className="underline" to="/briefs">
              Continue reading related briefs
            </Link>
          </p>
        ) : null}
      </Panel>
      <Panel title="Items">
        <ul className="space-y-2 text-sm">
          {(data?.items ?? []).map((i) => {
            const payload = parseJsonField(i.payloadJson);
            const why = payload.whyIncluded ?? payload;
            const badges = [
              i.readingState === 'dismissed' ? 'dismissed' : null,
              payload.stale ? 'stale' : null,
              payload.retracted ? 'retracted' : null,
              payload.redacted ? 'redacted' : null,
              payload.sourceUnavailable ? 'source unavailable' : null,
            ].filter(Boolean);
            return (
              <li
                key={String(i.id)}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-2"
              >
                <div>
                  <p className="font-medium">{String(i.title ?? i.section ?? i.id)}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {String(i.readingState ?? 'unread')} · {String(i.reason ?? '')}
                    {badges.length ? ` · ${badges.join(' · ')}` : ''}
                  </p>
                  <details className="mt-1">
                    <summary className="cursor-pointer text-xs text-[var(--muted)]">
                      Why included
                    </summary>
                    <WhyIncludedPreview value={why} />
                  </details>
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
            );
          })}
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

  const scheduler = (panels?.scheduler ?? {}) as Record<string, unknown>;
  const jobs = (panels?.jobs as Array<Record<string, unknown>>) ?? [];
  const fdaSchedules = (scheduler.fdaBulkSchedules as Array<Record<string, unknown>>) ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Operations"
        description="Local runtime, database, scheduler, backups, and storage."
      />
      {overview.loading ? <SkeletonBlock className="h-40 w-full" /> : null}
      {overview.error ? (
        <p className="text-sm text-[var(--tone-flag-fg)]">{overview.error}</p>
      ) : null}
      {actionMsg ? <p className="text-sm text-[var(--muted)]">{actionMsg}</p> : null}

      {panels ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Panel title="Overall health">
            <HealthBadge status={String(panels.overall ?? 'unknown')} />
          </Panel>
          <Panel title="Runtime & schema">
            <StatusDl
              entries={Object.entries((panels.versions as Record<string, unknown>) ?? {})}
            />
          </Panel>
          <Panel title="Database integrity">
            <StatusDl
              entries={Object.entries((panels.database as Record<string, unknown>) ?? {})}
            />
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
          <Panel title="Worker">
            <StatusDl
              entries={Object.entries(
                (panels.worker as Record<string, unknown>) ?? { status: '—' },
              )}
            />
          </Panel>
          <Panel title="Scheduler">
            <StatusDl
              entries={[
                ['enabled', scheduler.enabled],
                ['timezone', scheduler.timezone],
                ['schedule', scheduler.schedule],
                ['next run', scheduler.nextRunAt],
                ['last enqueued', scheduler.lastEnqueuedAt],
                ['last completed', scheduler.lastCompletedAt],
                ['last catch-up', scheduler.lastCatchupReason],
              ]}
            />
            {fdaSchedules.length > 0 ? (
              <table className="mt-3 w-full text-left text-xs">
                <caption className="sr-only">FDA bulk schedules</caption>
                <thead>
                  <tr>
                    <th scope="col">Job</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {fdaSchedules.map((row, idx) => (
                    <tr key={String(row.id ?? row.name ?? idx)}>
                      <td>{String(row.id ?? row.name ?? row.sourceId ?? `job-${idx}`)}</td>
                      <td>{String(row.status ?? row.enabled ?? row.cadence ?? '—')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </Panel>
          <Panel title="Jobs">
            {jobs.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No recent jobs.</p>
            ) : (
              <table className="w-full text-left text-xs">
                <caption className="sr-only">Recent jobs</caption>
                <thead>
                  <tr>
                    <th scope="col">Kind</th>
                    <th scope="col">Status</th>
                    <th scope="col">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={String(job.id)}>
                      <td>{String(job.kind ?? job.name ?? job.id)}</td>
                      <td>
                        <HealthBadge status={String(job.status ?? 'unknown')} />
                      </td>
                      <td>
                        {job.updatedAt || job.completedAt || job.createdAt
                          ? formatWhen(
                              new Date(
                                Number(job.updatedAt ?? job.completedAt ?? job.createdAt),
                              ).toISOString(),
                            )
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
          <Panel title="Sources">
            <StatusDl entries={Object.entries((panels.sources as Record<string, unknown>) ?? {})} />
          </Panel>
          <Panel title="Intelligence">
            <StatusDl
              entries={Object.entries((panels.intelligence as Record<string, unknown>) ?? {})}
            />
          </Panel>
          <Panel title="Dossiers & creators">
            <StatusDl
              entries={[
                ...Object.entries(
                  (panels.dossiers as Record<string, unknown>) ?? {
                    note: 'See intervention dossiers routes',
                  },
                ),
                ...Object.entries(
                  (panels.creators as Record<string, unknown>) ?? {
                    note: 'See creator routes',
                  },
                ),
              ]}
            />
          </Panel>
          <Panel title="Alerts & briefs">
            <StatusDl
              entries={Object.entries((panels.alertsBriefs as Record<string, unknown>) ?? {})}
            />
          </Panel>
          <Panel title="Backups">
            <ul className="space-y-1 text-sm">
              {((panels.backups as Array<Record<string, unknown>>) ?? []).map((b) => (
                <li key={String(b.name)}>{String(b.name)}</li>
              ))}
            </ul>
          </Panel>
          <Panel title="Storage & retention">
            <ul className="space-y-1 text-sm">
              {((panels.storage as Array<Record<string, unknown>>) ?? []).map((s) => (
                <li key={String(s.category ?? s.path)}>
                  {String(s.category)}: {String(s.fileCount)} files / {String(s.byteLength)} bytes
                </li>
              ))}
            </ul>
            <div className="mt-2">
              <StatusDl
                entries={Object.entries((panels.retention as Record<string, unknown>) ?? {})}
              />
            </div>
          </Panel>
          <Panel title="Platform compliance">
            <StatusDl
              entries={Object.entries((panels.platformCompliance as Record<string, unknown>) ?? {})}
            />
          </Panel>
          <Panel title="Security gates">
            <StatusDl
              entries={Object.entries((panels.security as Record<string, unknown>) ?? {})}
            />
          </Panel>
          <Panel title="Recent redacted errors">
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
        <button
          type="button"
          className={btnClass}
          onClick={() => {
            const body = JSON.stringify(diagRaw ?? overview.data ?? {}, null, 2);
            downloadText('operations-diagnostics.json', body, 'application/json');
          }}
        >
          Download raw diagnostics
        </button>
      </div>

      <details className="card">
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

      <Panel title="Mute rules">
        <p className="text-sm text-[var(--muted)]">
          Manage source, topic, event-type, and object mutes with optional expiry.
        </p>
        <Link className="mt-2 inline-block text-sm underline" to="/settings/mutes">
          Open Mute Rules
        </Link>
      </Panel>
    </div>
  );
}

export function BriefingsSettingsPage() {
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [sections, setSections] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      m6Api.briefingSettings(),
      m6Api.getPreference('briefingSections'),
      m6Api.briefingStatus(),
    ])
      .then(([r, pref, st]) => {
        setSettings(r.settings);
        const val = (pref.preference?.value ?? {}) as Record<string, boolean>;
        const next: Record<string, boolean> = {};
        for (const key of TAXONOMY.briefingSections) {
          next[key] = val[key] !== false;
        }
        setSections(next);
        setStatus(st.status ?? null);
      })
      .catch((e) => setError(String(e)));
  }, []);

  async function patch(patchBody: Record<string, unknown>) {
    try {
      const r = await m6Api.updateBriefingSettings(patchBody);
      setSettings((r as { settings: Record<string, unknown> }).settings);
    } catch (e) {
      setError(String(e));
    }
  }

  async function patchSection(key: string, enabled: boolean) {
    const next = { ...sections, [key]: enabled };
    setSections(next);
    try {
      await m6Api.setPreference('briefingSections', next);
    } catch (e) {
      setError(String(e));
    }
  }

  if (!settings) return <SkeletonBlock className="h-48 w-full" />;

  const schedule = (status?.schedule ?? {}) as Record<string, unknown>;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Briefing settings"
        description="Daily/weekly schedule, caps, and section toggles for the local profile."
      />
      {error ? <p className="text-sm text-[var(--tone-flag-fg)]">{error}</p> : null}
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

      <Panel title="Section toggles">
        <ul className="space-y-2 text-sm">
          {TAXONOMY.briefingSections.map((key) => (
            <li key={key}>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sections[key] !== false}
                  onChange={(e) => void patchSection(key, e.target.checked)}
                />
                {key.replaceAll('_', ' ')}
              </label>
            </li>
          ))}
        </ul>
      </Panel>

      {status ? (
        <Panel title="Status">
          <StatusDl
            entries={[
              ['timezone', (schedule as { timezone?: string }).timezone],
              ['catch-up policy', status.catchUpPolicy],
              [
                'last daily',
                status.lastDailyRun
                  ? formatWhen(
                      new Date(
                        Number((status.lastDailyRun as Record<string, unknown>).completedAt),
                      ).toISOString(),
                    )
                  : '—',
              ],
              [
                'last weekly',
                status.lastWeeklyRun
                  ? formatWhen(
                      new Date(
                        Number((status.lastWeeklyRun as Record<string, unknown>).completedAt),
                      ).toISOString(),
                    )
                  : '—',
              ],
            ]}
          />
        </Panel>
      ) : null}
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
    priorityFloor: 'medium',
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

  const floorLocked = FLOOR_LOCKED_TARGETS.has(form.targetType);
  const minFloor = floorLocked ? 'medium' : 'low';

  function resetForm() {
    setEditing(null);
    setForm({
      name: '',
      targetType: 'watchlist',
      targetRef: '',
      eventKinds: '',
      family: 'research',
      priorityFloor: 'medium',
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
      priorityFloor: String(sev.priorityFloor ?? 'medium'),
      enabled: Boolean(rule.enabled),
    });
  }

  async function saveRule() {
    let priorityFloor = form.priorityFloor;
    if (FLOOR_LOCKED_TARGETS.has(form.targetType) && (PRIORITY_RANK[priorityFloor] ?? 0) < 1) {
      priorityFloor = 'medium';
    }
    const body = {
      name: form.name.trim(),
      targetType: form.targetType,
      targetRef: form.targetRef.trim() || null,
      eventKinds: parseCsv(form.eventKinds),
      family: form.family,
      priorityFloor,
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
      {error ? <p className="text-sm text-[var(--tone-flag-fg)]">{error}</p> : null}

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
            onChange={(e) => {
              const targetType = e.target.value;
              setForm((f) => ({
                ...f,
                targetType,
                priorityFloor:
                  FLOOR_LOCKED_TARGETS.has(targetType) && (PRIORITY_RANK[f.priorityFloor] ?? 0) < 1
                    ? 'medium'
                    : f.priorityFloor,
                family: FLOOR_LOCKED_TARGETS.has(targetType) ? 'operational' : f.family,
              }));
            }}
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
          <label className="block text-sm sm:col-span-2">
            Priority floor
            <select
              className={`mt-1 w-full ${inputClass}`}
              value={form.priorityFloor}
              onChange={(e) => setForm((f) => ({ ...f, priorityFloor: e.target.value }))}
              aria-label="Priority floor"
            >
              {TAXONOMY.alertPriority.map((p) => (
                <option
                  key={p}
                  value={p}
                  disabled={(PRIORITY_RANK[p] ?? 0) < (PRIORITY_RANK[minFloor] ?? 0)}
                >
                  {p}
                  {floorLocked && p === 'low' ? ' (blocked for integrity targets)' : ''}
                </option>
              ))}
            </select>
          </label>
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
        {floorLocked ? (
          <p className="mt-2 text-xs text-[var(--tone-watch-fg)]">
            Integrity targets cannot be set below medium priority floor.
          </p>
        ) : null}
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
                      {String(sev.family ?? 'research')} · floor{' '}
                      {String(sev.priorityFloor ?? 'medium')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="text-xs underline" onClick={() => loadRule(r)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-xs text-[var(--tone-flag-fg)] underline"
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

export function MuteRulesPage() {
  const mode = useLiveMode();
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    scopeType: 'object',
    scopeId: '',
    scopeEventType: '',
    reason: '',
    forever: false,
    expiresLocal: '',
  });

  async function reload() {
    const res = await m6Api.listMutes();
    setItems(res.items ?? []);
  }

  useEffect(() => {
    if (mode !== 'live') return;
    void reload().catch((e) => setError(String(e)));
  }, [mode]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    try {
      const expiresAt = form.forever
        ? null
        : form.expiresLocal
          ? new Date(form.expiresLocal).getTime()
          : Date.now() + 7 * 86400000;
      await m6Api.createMute({
        scopeType: form.scopeType,
        scopeId: form.scopeId.trim() || undefined,
        scopeEventType: form.scopeEventType.trim() || undefined,
        reason: form.reason.trim() || undefined,
        expiresAt,
      });
      setForm({
        scopeType: 'object',
        scopeId: '',
        scopeEventType: '',
        reason: '',
        forever: false,
        expiresLocal: '',
      });
      await reload();
    } catch (err) {
      setError(String(err));
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Mute rules"
        description="Silence objects, topics, sources, or event types for a period or forever."
      />
      {mode === 'demo' ? <DemoBanner notice={DEMO_SNAPSHOT_NOTICE} /> : null}
      {error ? <p className="text-sm text-[var(--tone-flag-fg)]">{error}</p> : null}
      {mode === 'live' ? (
        <>
          <form className="space-y-3 card" onSubmit={(e) => void onCreate(e)}>
            <h2 className="t-section">Create mute</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                className={inputClass}
                value={form.scopeType}
                onChange={(e) => setForm((f) => ({ ...f, scopeType: e.target.value }))}
                aria-label="Scope type"
              >
                {TAXONOMY.muteScopes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <input
                className={inputClass}
                placeholder="Scope id / object id"
                value={form.scopeId}
                onChange={(e) => setForm((f) => ({ ...f, scopeId: e.target.value }))}
                aria-label="Scope id"
              />
              <input
                className={inputClass}
                placeholder="Event type (optional)"
                value={form.scopeEventType}
                onChange={(e) => setForm((f) => ({ ...f, scopeEventType: e.target.value }))}
                aria-label="Event type"
              />
              <input
                className={inputClass}
                placeholder="Reason"
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                aria-label="Reason"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.forever}
                  onChange={(e) => setForm((f) => ({ ...f, forever: e.target.checked }))}
                />
                Forever
              </label>
              {!form.forever ? (
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={form.expiresLocal}
                  onChange={(e) => setForm((f) => ({ ...f, expiresLocal: e.target.value }))}
                  aria-label="Expires at"
                />
              ) : null}
            </div>
            <button type="submit" className={btnClass}>
              Create mute
            </button>
          </form>

          <Panel title="Active & recent mutes">
            {items.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No mute rules yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {items.map((m) => {
                  const expired =
                    m.expiresAt != null &&
                    Number(m.expiresAt) > 0 &&
                    Number(m.expiresAt) <= Date.now();
                  return (
                    <li
                      key={String(m.id)}
                      className="flex flex-wrap items-center justify-between gap-2 rounded border border-[var(--border)] p-2"
                    >
                      <div>
                        <p className="font-medium">
                          {String(m.scopeType)}
                          {m.scopeId ? ` · ${String(m.scopeId)}` : ''}
                          {!m.active || expired ? (
                            <span className="ml-2 text-xs text-[var(--muted)]">
                              ({expired ? 'expired' : 'disabled'})
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {String(m.reason ?? '—')}
                          {m.expiresAt
                            ? ` · until ${formatWhen(new Date(Number(m.expiresAt)).toISOString())}`
                            : ' · forever'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {m.active ? (
                          <button
                            type="button"
                            className="text-xs underline"
                            onClick={() =>
                              void m6Api.updateMute(String(m.id), { active: false }).then(reload)
                            }
                          >
                            Disable
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="text-xs underline"
                            onClick={() =>
                              void m6Api.updateMute(String(m.id), { active: true }).then(reload)
                            }
                          >
                            Re-enable
                          </button>
                        )}
                        <button
                          type="button"
                          className="text-xs text-[var(--tone-flag-fg)] underline"
                          onClick={() => {
                            if (!window.confirm('Delete this mute rule?')) return;
                            void m6Api.deleteMute(String(m.id)).then(reload);
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
        </>
      ) : null}
    </div>
  );
}
