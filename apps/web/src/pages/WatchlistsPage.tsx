import { Link } from 'react-router-dom';
import { DemoBanner } from '@healthspan/ui';
import { DEMO_SNAPSHOT_NOTICE } from '@healthspan/core';
import { PageHeader, FollowButton } from '../components/Common';
import { usePreferences } from '../state/PreferencesContext';
import { useAsync } from '../hooks/useAsync';
import { fetchItems } from '../lib/api';
import { itemPath } from '../lib/nav';
import { SkeletonBlock } from '@healthspan/ui';

export function WatchlistsPage() {
  const { prefs } = usePreferences();
  const { data, loading } = useAsync(() => fetchItems(), []);

  const followed = (data?.items ?? []).filter((item) => prefs.followedIds.includes(item.id));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Watchlists"
        description="Prototype watchlists persist in localStorage. Follow interventions, trials, creators, and topics — not personal medical records."
      />
      <DemoBanner notice={DEMO_SNAPSHOT_NOTICE} />

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
          <h2 className="text-sm font-semibold">Followed items ({prefs.followedIds.length})</h2>
        </div>
        {loading ? (
          <SkeletonBlock className="h-24 w-full" />
        ) : followed.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No followed items yet. Open a dossier and click Follow.</p>
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
