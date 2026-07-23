import { PageHeader } from '../components/Common';
import { useAsync } from '../hooks/useAsync';
import { SkeletonBlock } from '@healthspan/ui';

async function fetchReviewTasks() {
  const res = await fetch('/api/review/tasks');
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<{ tasks: Array<Record<string, unknown>> }>;
}

export function ReviewQueuePage() {
  const { data, loading, error } = useAsync(() => fetchReviewTasks(), []);

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonBlock className="h-10 w-64" />
        <SkeletonBlock className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Review Queue"
        description="Low-confidence or provenance-sensitive Live extractions requiring human confirmation. Demo mode review tasks remain on Today."
      />
      {error ? <p className="text-rose-300">{error}</p> : null}
      {(data?.tasks ?? []).length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No open Live review tasks.</p>
      ) : (
        <ul className="space-y-2">
          {(data?.tasks ?? []).map((task) => (
            <li key={String(task.id)} className="rounded-lg border border-[var(--border)] px-3 py-2">
              <p className="font-medium">{String(task.title)}</p>
              <p className="text-sm text-[var(--muted)]">{String(task.reason)}</p>
              <p className="text-xs text-[var(--muted)]">
                {String(task.status)} · confidence {String(task.confidence)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
