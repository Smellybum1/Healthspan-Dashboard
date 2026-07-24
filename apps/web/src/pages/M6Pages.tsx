import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DemoBanner, SkeletonBlock } from '@healthspan/ui';
import { DEMO_SNAPSHOT_NOTICE } from '@healthspan/core';
import { FollowButton, PageHeader } from '../components/Common';
import { fetchItems, fetchMode } from '../lib/api';
import { m6Api } from '../lib/m6Api';
import { useAsync } from '../hooks/useAsync';
import { formatWhen, itemPath } from '../lib/nav';
import { usePreferences } from '../state/PreferencesContext';

function useLiveMode() {
  const modeState = useAsync(() => fetchMode(), []);
  return modeState.data?.dataMode ?? 'live';
}

export function WatchlistsPage() {
  const mode = useLiveMode();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lists, setLists] = useState<Array<Record<string, unknown>>>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [entries, setEntries] = useState<Array<Record<string, unknown>>>([]);
  const [targetId, setTargetId] = useState('');
  const [targetType, setTargetType] = useState('content_item');

  async function reload() {
    if (mode !== 'live') return;
    const res = await m6Api.listWatchlists();
    setLists(res.items);
    setSelected((prev) => prev ?? (res.items[0] ? String(res.items[0].id) : null));
  }

  useEffect(() => {
    void reload().catch((e) => setError(String(e)));
    // Intentionally mode-only: reload closes over latest selected via functional setState.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (!selected || mode !== 'live') return;
    void m6Api
      .getWatchlist(selected)
      .then((r) => setEntries(r.entries))
      .catch((e) => setError(String(e)));
  }, [selected, mode]);

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
          <form onSubmit={onCreate} className="flex flex-wrap gap-2">
            <input
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              placeholder="New watchlist name"
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              aria-label="New watchlist name"
            />
            <button
              type="submit"
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            >
              Create
            </button>
          </form>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <h2 className="text-sm font-semibold">Lists</h2>
              <ul className="mt-2 space-y-2 text-sm">
                {lists.map((w) => (
                  <li key={String(w.id)} className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="underline"
                      onClick={() => setSelected(String(w.id))}
                    >
                      {String(w.name)}
                    </button>
                    {w.isDefault ? <span className="text-[var(--muted)]">(default)</span> : null}
                    <button
                      type="button"
                      className="text-xs text-[var(--muted)]"
                      onClick={() => {
                        const next = window.prompt('Rename watchlist', String(w.name));
                        if (!next?.trim()) return;
                        void m6Api.renameWatchlist(String(w.id), next.trim()).then(reload);
                      }}
                    >
                      Rename
                    </button>
                    {!w.isDefault ? (
                      <button
                        type="button"
                        className="text-xs text-[var(--muted)]"
                        onClick={() => {
                          if (!window.confirm(`Archive “${String(w.name)}”?`)) return;
                          void m6Api.archiveWatchlist(String(w.id)).then(reload);
                        }}
                      >
                        Archive
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <h2 className="text-sm font-semibold">Items</h2>
              <form
                className="mt-2 flex flex-wrap gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!selected || !targetId.trim()) return;
                  void m6Api
                    .addWatchlistItem(selected, {
                      targetType,
                      targetId: targetId.trim(),
                      displayTitle: targetId.trim(),
                    })
                    .then(() => m6Api.getWatchlist(selected))
                    .then((r) => {
                      setEntries(r.entries);
                      setTargetId('');
                    })
                    .catch((err) => setError(String(err)));
                }}
              >
                <select
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm"
                  value={targetType}
                  onChange={(ev) => setTargetType(ev.target.value)}
                  aria-label="Target type"
                >
                  <option value="content_item">content_item</option>
                  <option value="intervention">intervention</option>
                  <option value="trial">trial</option>
                  <option value="creator">creator</option>
                  <option value="paper">paper</option>
                </select>
                <input
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm"
                  placeholder="Target ID"
                  value={targetId}
                  onChange={(ev) => setTargetId(ev.target.value)}
                  aria-label="Target ID"
                />
                <button
                  type="submit"
                  className="rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm"
                >
                  Add
                </button>
              </form>
              <ul className="mt-3 divide-y divide-[var(--border)] text-sm">
                {entries.map((e) => {
                  const w = e.watchable as Record<string, unknown> | null;
                  return (
                    <li key={String(e.id)} className="flex items-center justify-between gap-2 py-2">
                      <span>
                        {String(w?.displayTitle ?? w?.targetId ?? e.watchableId)}{' '}
                        <span className="text-[var(--muted)]">({String(w?.targetType ?? '')})</span>
                      </span>
                      <button
                        type="button"
                        className="text-xs underline"
                        onClick={() => {
                          if (!selected) return;
                          void m6Api
                            .removeWatchlistItem(selected, String(e.watchableId))
                            .then(() => m6Api.getWatchlist(selected))
                            .then((r) => setEntries(r.entries));
                        }}
                      >
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
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

export function SavedSearchesPage() {
  const mode = useLiveMode();
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
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
            className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
            onSubmit={(e) => {
              e.preventDefault();
              void m6Api
                .createSavedSearch(name.trim() || 'Untitled search', {
                  schemaVersion: 1,
                  text: text.trim() || undefined,
                })
                .then(() => {
                  setName('');
                  setText('');
                  return reload();
                })
                .catch((err) => setError(String(err)));
            }}
          >
            <h2 className="text-sm font-semibold">Builder</h2>
            <input
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
              placeholder="Name"
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              aria-label="Saved search name"
            />
            <input
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
              placeholder="Contains text"
              value={text}
              onChange={(ev) => setText(ev.target.value)}
              aria-label="Contains text"
            />
            <button
              type="submit"
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            >
              Save search
            </button>
          </form>
          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 className="text-sm font-semibold">Saved</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {items.map((s) => (
                <li key={String(s.id)} className="flex flex-wrap items-center gap-2">
                  <Link className="underline" to={`/saved-searches/${String(s.id)}`}>
                    {String(s.name)}
                  </Link>
                  <span className="text-[var(--muted)]">{String(s.state)}</span>
                  <button
                    type="button"
                    className="text-xs underline"
                    onClick={() =>
                      void m6Api
                        .runSavedSearch(String(s.id))
                        .then((r) =>
                          setHistory(
                            (r as { matches?: Array<Record<string, unknown>> }).matches ?? [],
                          ),
                        )
                        .catch((err) => setError(String(err)))
                    }
                  >
                    Run
                  </button>
                  <button
                    type="button"
                    className="text-xs underline"
                    onClick={() => void m6Api.archiveSavedSearch(String(s.id)).then(reload)}
                  >
                    Archive
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 className="text-sm font-semibold">Match history (last run)</h2>
            {history.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--muted)]">
                Run a saved search to preview matches.
              </p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {history.map((m) => (
                  <li key={String(m.id)}>
                    {String(m.title)}{' '}
                    <span className="text-[var(--muted)]">({String(m.kind)})</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

export function SavedSearchDetailPage() {
  const { id = '' } = useParams();
  const [item, setItem] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    void m6Api.listSavedSearches().then((r) => {
      setItem(r.items.find((x) => String(x.id) === id) ?? null);
    });
  }, [id]);
  return (
    <div className="space-y-4">
      <PageHeader title={String(item?.name ?? 'Saved search')} description="Saved search detail" />
      <pre className="overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-xs">
        {item ? JSON.stringify(JSON.parse(String(item.queryJson ?? '{}')), null, 2) : 'Loading…'}
      </pre>
      <Link className="text-sm underline" to="/saved-searches">
        Back to saved searches
      </Link>
    </div>
  );
}

export function AlertsPage() {
  const mode = useLiveMode();
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    await m6Api.evaluateAlerts().catch(() => undefined);
    const res = await m6Api.listAlerts();
    setItems(res.items);
  }

  useEffect(() => {
    if (mode !== 'live') return;
    void reload().catch((e) => setError(String(e)));
  }, [mode]);

  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((a) => String(a.state) === filter)),
    [items, filter],
  );

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
            className="rounded-lg border border-[var(--border)] px-2 py-1 text-xs"
            aria-pressed={filter === s}
            onClick={() => setFilter(s)}
          >
            {s}
          </button>
        ))}
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] px-2 py-1 text-xs"
          onClick={() => void reload()}
        >
          Refresh
        </button>
      </div>
      <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        {filtered.map((a) => (
          <li
            key={String(a.id)}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
          >
            <div>
              <Link className="font-medium underline" to={`/alerts/${String(a.id)}`}>
                {String(a.title)}
              </Link>
              <p className="text-xs text-[var(--muted)]">
                {String(a.importance)} · {String(a.state)} ·{' '}
                {formatWhen(new Date(Number(a.occurredAt)).toISOString())}
              </p>
            </div>
            <div className="flex gap-2">
              {['read', 'acknowledged', 'snoozed', 'dismissed', 'resolved'].map((state) => (
                <button
                  key={state}
                  type="button"
                  className="text-xs underline"
                  onClick={() =>
                    void m6Api
                      .setAlertState(String(a.id), state)
                      .then(reload)
                      .catch((e) => setError(String(e)))
                  }
                >
                  {state}
                </button>
              ))}
            </div>
          </li>
        ))}
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
  useEffect(() => {
    void m6Api
      .getAlert(id)
      .then((r) => setItem(r.item))
      .catch(() => setItem(null));
  }, [id]);
  return (
    <div className="space-y-4">
      <PageHeader
        title={String(item?.title ?? 'Alert')}
        description="Alert detail and why-included payload"
      />
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm">
        <p>
          <strong>State:</strong> {String(item?.state ?? '—')}
        </p>
        <p className="mt-2">{String(item?.summary ?? '')}</p>
        <h2 className="mt-4 text-sm font-semibold">Why included</h2>
        <pre className="mt-2 overflow-auto rounded-lg bg-[var(--surface-2)] p-2 text-xs">
          {String(item?.payloadJson ?? '{}')}
        </pre>
      </section>
      <Link className="text-sm underline" to="/alerts">
        Back to Alert Centre
      </Link>
    </div>
  );
}

export function BriefsPage() {
  const mode = useLiveMode();
  const [tab, setTab] = useState<'daily' | 'weekly'>('daily');
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const res = await m6Api.listBriefs();
    setItems(res.items.filter((b) => String(b.kind) === tab));
  }

  useEffect(() => {
    if (mode !== 'live') return;
    void reload().catch((e) => setError(String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, tab]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Briefings"
        description="Daily and weekly research briefings from Live personalisation."
      />
      {mode === 'demo' ? <DemoBanner notice={DEMO_SNAPSHOT_NOTICE} /> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
          aria-pressed={tab === 'daily'}
          onClick={() => setTab('daily')}
        >
          Daily
        </button>
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
          aria-pressed={tab === 'weekly'}
          onClick={() => setTab('weekly')}
        >
          Weekly
        </button>
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
          onClick={() =>
            void m6Api
              .generateBrief(tab)
              .then(reload)
              .catch((e) => setError(String(e)))
          }
        >
          Generate {tab}
        </button>
      </div>
      <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        {items.map((b) => (
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
      {items.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No {tab} briefs yet.</p>
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
  useEffect(() => {
    void m6Api
      .getBrief(id)
      .then(setData)
      .catch(() => setData(null));
  }, [id]);

  function exportMarkdown() {
    if (!data) return;
    const md = [
      `# ${String(data.brief.title ?? 'Brief')}`,
      '',
      ...data.items.map((i) => `- ${String(i.title ?? i.payloadJson)}`),
    ].join('\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brief-${id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportJson() {
    if (!data) return;
    const blob = new Blob([JSON.stringify({ formatVersion: 1, ...data }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brief-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={String(data?.brief.title ?? 'Brief')}
        description="Brief detail, source coverage, and export"
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
              onClick={exportMarkdown}
            >
              Export Markdown
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
              onClick={exportJson}
            >
              Export JSON
            </button>
          </div>
        }
      />
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="text-sm font-semibold">Source coverage</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {(data?.items ?? []).map((i) => (
            <li key={String(i.id)}>{String(i.title ?? i.section ?? i.id)}</li>
          ))}
        </ul>
      </section>
      <Link className="text-sm underline" to="/briefs">
        Back to briefings
      </Link>
    </div>
  );
}

export function OperationsPage() {
  const overview = useAsync(() => m6Api.opsOverview(), []);
  return (
    <div className="space-y-4">
      <PageHeader
        title="Operations"
        description="Local runtime, database, scheduler, backups, and storage."
      />
      {overview.loading ? <SkeletonBlock className="h-40 w-full" /> : null}
      {overview.error ? <p className="text-sm text-red-600">{overview.error}</p> : null}
      {overview.data ? (
        <pre
          tabIndex={0}
          role="region"
          aria-label="Operations overview"
          className="overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-xs"
        >
          {JSON.stringify(overview.data, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

export function BackupSettingsPage() {
  const [backups, setBackups] = useState<Array<Record<string, unknown>>>([]);
  const [storage, setStorage] = useState<Array<Record<string, unknown>>>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [passphrase, setPassphrase] = useState('');

  async function reload() {
    const [b, s] = await Promise.all([m6Api.listBackups(), m6Api.storage()]);
    setBackups(b.items ?? []);
    setStorage(s.categories ?? []);
  }

  useEffect(() => {
    void reload().catch((e) => setMessage(String(e)));
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Backup & Storage"
        description="Create recovery/portable backups, verify archives, and review storage. Restore remains CLI-only."
      />
      {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
        <h2 className="text-sm font-semibold">Create</h2>
        <input
          type="password"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
          placeholder="Portable passphrase (not persisted)"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          aria-label="Portable passphrase"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
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
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
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
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
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
        <p className="text-xs text-[var(--muted)]">
          Restore CLI: <code>pnpm backup:restore -- --input &lt;archive&gt; --dry-run</code>
        </p>
      </section>
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="text-sm font-semibold">Archives</h2>
        <ul className="mt-2 space-y-2 text-sm">
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
      </section>
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="text-sm font-semibold">Storage / retention preview</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {storage.map((c) => (
            <li key={String(c.category)}>
              {String(c.category)}: {String(c.fileCount)} files / {String(c.byteLength)} bytes
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function PersonalisationMigrationPage() {
  const [raw, setRaw] = useState('');
  const [preview, setPreview] = useState<unknown>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const legacy = localStorage.getItem('healthspan.preferences');
      if (legacy) setRaw(legacy);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Personalisation migration"
        description="Preview and import known Live legacy browser keys into SQLite. Demo IDs are blocked."
      />
      <textarea
        className="min-h-40 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-xs font-mono"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        aria-label="Legacy preferences JSON"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
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
          Preview
        </button>
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
          onClick={() => {
            try {
              const prefs = JSON.parse(raw);
              void m6Api
                .importApply(prefs)
                .then((r) => {
                  setPreview(r);
                  setMessage('Import completed (idempotent).');
                })
                .catch((e) => setMessage(String(e)));
            } catch (e) {
              setMessage(String(e));
            }
          }}
        >
          Import
        </button>
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
          onClick={() => {
            const blob = new Blob([raw], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'healthspan-legacy-preferences.json';
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export legacy
        </button>
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
          onClick={() => setMessage('Remind later — migration skipped for now.')}
        >
          Remind later
        </button>
      </div>
      {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}
      {preview ? (
        <pre className="overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-xs">
          {JSON.stringify(preview, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

export function PrivacySecurityPage() {
  const [notifPref, setNotifPref] = useState(
    () => localStorage.getItem('healthspan.browserNotifications') === '1',
  );
  const [perm, setPerm] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied',
  );
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Privacy & Security"
        description="Local-only profile, request integrity, retention, backup exclusions, and browser notifications."
      />
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm space-y-2">
        <p>Local single-user profile — no hosted identity or medical records.</p>
        <p>Request-integrity sessions use HttpOnly cookies + CSRF tokens for mutations.</p>
        <p>Remote bind requires an explicit token (≥32 chars). Loopback is default.</p>
        <p>Portable backups exclude secrets, absolute paths, and restricted platform text.</p>
      </section>
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
        <h2 className="text-sm font-semibold">Browser notifications</h2>
        <p className="text-sm text-[var(--muted)]">
          While-page-open only. No source body text in test notifications.
        </p>
        <p className="text-xs text-[var(--muted)]">Permission: {perm}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
            onClick={async () => {
              if (typeof Notification === 'undefined') {
                setMessage('Notifications API unavailable.');
                return;
              }
              const result = await Notification.requestPermission();
              setPerm(result);
              if (result === 'granted') {
                localStorage.setItem('healthspan.browserNotifications', '1');
                setNotifPref(true);
              }
            }}
          >
            Opt in (user gesture)
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
            onClick={() => {
              if (
                !notifPref ||
                typeof Notification === 'undefined' ||
                Notification.permission !== 'granted'
              ) {
                setMessage('Enable notifications first.');
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
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
            onClick={() => {
              localStorage.setItem('healthspan.browserNotifications', '0');
              setNotifPref(false);
              setMessage(
                'App preference revoked. Browser-level permission must be revoked in browser settings.',
              );
            }}
          >
            Revoke app preference
          </button>
        </div>
        {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}
      </section>
    </div>
  );
}

export function BriefingsSettingsPage() {
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    void m6Api.briefingSettings().then((r) => setSettings(r.settings));
  }, []);
  return (
    <div className="space-y-4">
      <PageHeader
        title="Briefing settings"
        description="Daily/weekly schedule toggles for the local profile."
      />
      {settings ? (
        <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(settings.dailyEnabled)}
              onChange={(e) =>
                void m6Api
                  .updateBriefingSettings({ dailyEnabled: e.target.checked })
                  .then((r) => setSettings((r as { settings: Record<string, unknown> }).settings))
              }
            />
            Daily briefs enabled
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(settings.weeklyEnabled)}
              onChange={(e) =>
                void m6Api
                  .updateBriefingSettings({ weeklyEnabled: e.target.checked })
                  .then((r) => setSettings((r as { settings: Record<string, unknown> }).settings))
              }
            />
            Weekly briefs enabled
          </label>
        </div>
      ) : (
        <SkeletonBlock className="h-24 w-full" />
      )}
    </div>
  );
}

export function AlertsSettingsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Alert settings"
        description="Alert evaluation is deterministic and local. Configure channels later."
      />
      <p className="text-sm text-[var(--muted)]">
        Use Alert Centre for state transitions. Browser notifications are configured under Privacy &
        Security.
      </p>
      <Link className="text-sm underline" to="/alerts">
        Open Alert Centre
      </Link>
    </div>
  );
}
