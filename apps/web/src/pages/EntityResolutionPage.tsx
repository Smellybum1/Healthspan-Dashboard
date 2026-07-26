import { useState } from 'react';
import { PageHeader } from '../components/Common';
import { useAsync } from '../hooks/useAsync';
import { SkeletonBlock } from '@healthspan/ui';
import { Link } from 'react-router-dom';
import { resolveEntityResolutionTask } from '../lib/api';

async function fetchTasks() {
  const res = await fetch('/api/entity-resolution/tasks');
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<{ tasks: Array<Record<string, unknown>> }>;
}

const ACTIONS = ['accept', 'reject', 'defer', 'keep_separate', 'create_entity'] as const;

export function EntityResolutionPage() {
  const { data, loading, error, reload } = useAsync(() => fetchTasks(), []);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [newNames, setNewNames] = useState<Record<string, string>>({});

  async function resolve(taskId: string, action: (typeof ACTIONS)[number]) {
    setBusyId(taskId);
    setMessage(null);
    try {
      await resolveEntityResolutionTask(taskId, {
        action,
        newEntityName: action === 'create_entity' ? newNames[taskId] : undefined,
      });
      setMessage(`Resolved with ${action}`);
      reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Resolve failed');
    } finally {
      setBusyId(null);
    }
  }

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
        description="Ambiguous aliases, collisions, and non-exact identity matches. Auto-merge is prohibited for fuzzy/homonym/AI candidates. Decisions are append-only."
      />
      {error ? <p className="text-[var(--tone-flag-fg)]">{error}</p> : null}
      {message ? <p className="text-sm text-[var(--tone-ok-fg)]">{message}</p> : null}
      {(data?.tasks ?? []).length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No open entity-resolution tasks.</p>
      ) : (
        <ul className="space-y-2">
          {(data?.tasks ?? []).map((task) => {
            const id = String(task.id);
            return (
              <li key={id} className="rounded-lg border border-[var(--border)] px-3 py-2">
                <p className="font-medium">{String(task.title)}</p>
                <p className="text-sm text-[var(--muted)]">{String(task.reason)}</p>
                <p className="text-xs text-[var(--muted)]">
                  {String(task.status)} · {String(task.priority)}
                  {task.proposedEntityId ? (
                    <>
                      {' · '}
                      <Link
                        className="underline"
                        to={`/interventions/${String(task.proposedEntityId)}`}
                      >
                        proposed entity
                      </Link>
                    </>
                  ) : null}
                </p>
                <label className="mt-2 block text-xs text-[var(--muted)]">
                  New entity name (for create_entity)
                  <input
                    className="mt-1 w-full rounded border border-[var(--border)] bg-transparent px-2 py-1 text-sm"
                    value={newNames[id] ?? ''}
                    onChange={(e) => setNewNames((prev) => ({ ...prev, [id]: e.target.value }))}
                  />
                </label>
                <div
                  className="mt-2 flex flex-wrap gap-2"
                  role="group"
                  aria-label={`Resolve ${id}`}
                >
                  {ACTIONS.map((action) => (
                    <button
                      key={action}
                      type="button"
                      disabled={busyId === id}
                      className="rounded-md border border-[var(--border)] px-2 py-1 text-xs capitalize disabled:opacity-50"
                      onClick={() => void resolve(id, action)}
                    >
                      {action.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
