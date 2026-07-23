import { PageHeader } from '../components/Common';
import { useAsync } from '../hooks/useAsync';
import { SkeletonBlock } from '@healthspan/ui';
import { Link } from 'react-router-dom';

async function fetchTasks() {
  const res = await fetch('/api/entity-resolution/tasks');
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<{ tasks: Array<Record<string, unknown>> }>;
}

export function EntityResolutionPage() {
  const { data, loading, error } = useAsync(() => fetchTasks(), []);

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
        title="Entity Resolution Queue"
        description="Ambiguous aliases, collisions, and non-exact identity matches. Auto-merge is prohibited for fuzzy/homonym/AI candidates."
      />
      {error ? <p className="text-rose-300">{error}</p> : null}
      {(data?.tasks ?? []).length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No open entity-resolution tasks.</p>
      ) : (
        <ul className="space-y-2">
          {(data?.tasks ?? []).map((task) => (
            <li key={String(task.id)} className="rounded-lg border border-[var(--border)] px-3 py-2">
              <p className="font-medium">{String(task.title)}</p>
              <p className="text-sm text-[var(--muted)]">{String(task.reason)}</p>
              <p className="text-xs text-[var(--muted)]">
                {String(task.status)} · {String(task.priority)}
                {task.proposedEntityId ? (
                  <>
                    {' · '}
                    <Link className="underline" to={`/interventions/${String(task.proposedEntityId)}`}>
                      proposed entity
                    </Link>
                  </>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
