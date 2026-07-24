import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DemoBanner } from '@healthspan/ui';
import { DEMO_SNAPSHOT_NOTICE } from '@healthspan/core';
import { PageHeader, FollowButton } from '../components/Common';
import { usePreferences } from '../state/PreferencesContext';
import { useAsync } from '../hooks/useAsync';
import { fetchItems, fetchMode, apiFetch } from '../lib/api';
import { itemPath } from '../lib/nav';
import { SkeletonBlock } from '@healthspan/ui';

type LiveWatchlist = { id: string; name: string; slug: string; isDefault: boolean };

export function WatchlistsPage() {
  const { prefs } = usePreferences();
  const modeState = useAsync(() => fetchMode(), []);
  const mode = modeState.data?.dataMode ?? 'live';
  const { data, loading } = useAsync(() => fetchItems(), []);
  const [liveLists, setLiveLists] = useState<LiveWatchlist[]>([]);
  const [sinceItems, setSinceItems] = useState<Array<{ id: string; title: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  const followed = (data?.items ?? []).filter((item) => prefs.followedIds.includes(item.id));

  useEffect(() => {
    if (mode !== 'live') return;
    void (async () => {
      try {
        await apiFetch('/api/visits', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: '{}',
        });
        const [wl, since] = await Promise.all([
          apiFetch('/api/watchlists').then((r) => r.json()),
          apiFetch('/api/since-last-visit').then((r) => r.json()),
        ]);
        setLiveLists((wl.items ?? []) as LiveWatchlist[]);
        setSinceItems(((since.items ?? []) as Array<{ id: string; title: string }>).slice(0, 12));
      } catch (e) {
        setError(String(e));
      }
    })();
  }, [mode]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Watchlists"
        description={
          mode === 'live'
            ? 'Live named watchlists persist in the local SQLite profile. Follow interventions, trials, creators, and topics — not personal medical records.'
            : 'Demo follow state uses browser preferences. Switch to Live for durable SQLite watchlists.'
        }
      />
      {mode === 'demo' ? <DemoBanner notice={DEMO_SNAPSHOT_NOTICE} /> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {mode === 'live' ? (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold">Named watchlists</h2>
          {liveLists.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--muted)]">
              Default “Following” watchlist is created on first Live use.
            </p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {liveLists.map((w) => (
                <li key={w.id}>
                  {w.name}{' '}
                  {w.isDefault ? <span className="text-[var(--muted)]">(default)</span> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {mode === 'live' && sinceItems.length > 0 ? (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold">Since your last visit</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {sinceItems.map((item) => (
              <li key={item.id}>{item.title}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="text-sm font-semibold">Followed topics</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {prefs.topics.map((topic) => (
            <span key={topic} className="rounded-md bg-[var(--surface-2)] px-2 py-1 text-xs">
              {topic}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">
            {mode === 'demo' ? 'Demo followed items' : 'Browser follow shortcuts'} (
            {prefs.followedIds.length})
          </h2>
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
    </div>
  );
}
