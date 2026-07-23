import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/Common';
import { useAsync } from '../hooks/useAsync';
import { SkeletonBlock } from '@healthspan/ui';
import { resolveReviewTask } from '../lib/api';

async function fetchReviewTasks() {
  const res = await fetch('/api/review/tasks?status=open');
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<{
    dataMode: string;
    tasks: Array<Record<string, unknown>>;
  }>;
}

const ACTIONS = ['accept', 'edit', 'reject', 'uncertain', 'dismiss'] as const;

export function ReviewQueuePage() {
  const { data, loading, error, reload } = useAsync(() => fetchReviewTasks(), []);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editText, setEditText] = useState<Record<string, string>>({});

  async function resolve(taskId: string, action: (typeof ACTIONS)[number], expectedAnalysisId?: string) {
    setBusyId(taskId);
    setMessage(null);
    try {
      await resolveReviewTask(taskId, {
        action,
        editedClaimText: action === 'edit' ? editText[taskId] : undefined,
        expectedAnalysisId,
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
        title="Review Queue"
        description="Low-confidence or provenance-sensitive Live extractions requiring human confirmation. Decisions are append-only."
      />
      {error ? <p className="text-rose-300">{error}</p> : null}
      {message ? <p className="text-sm text-teal-300">{message}</p> : null}
      {(data?.tasks ?? []).length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No open Live review tasks.</p>
      ) : (
        <ul className="space-y-3">
          {(data?.tasks ?? []).map((task) => {
            const id = String(task.id);
            return (
              <li key={id} className="rounded-lg border border-[var(--border)] px-3 py-3">
                <p className="font-medium">{String(task.title)}</p>
                <p className="text-sm text-[var(--muted)]">{String(task.reason)}</p>
                <p className="text-xs text-[var(--muted)]">
                  {String(task.status)} · confidence {String(task.confidence)}
                  {task.claimId ? (
                    <>
                      {' · '}
                      <Link className="underline" to={`/claims/${String(task.claimId)}`}>
                        claim
                      </Link>
                    </>
                  ) : null}
                </p>
                <label className="mt-2 block text-xs text-[var(--muted)]">
                  Edit claim text (for Edit action)
                  <textarea
                    className="mt-1 w-full rounded border border-[var(--border)] bg-transparent p-2 text-sm"
                    rows={2}
                    value={editText[id] ?? ''}
                    onChange={(e) => setEditText((prev) => ({ ...prev, [id]: e.target.value }))}
                  />
                </label>
                <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={`Resolve ${id}`}>
                  {ACTIONS.map((action) => (
                    <button
                      key={action}
                      type="button"
                      disabled={busyId === id}
                      className="rounded-md border border-[var(--border)] px-2 py-1 text-xs capitalize disabled:opacity-50"
                      onClick={() =>
                        void resolve(
                          id,
                          action,
                          task.expectedAnalysisId ? String(task.expectedAnalysisId) : undefined,
                        )
                      }
                    >
                      {action}
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
