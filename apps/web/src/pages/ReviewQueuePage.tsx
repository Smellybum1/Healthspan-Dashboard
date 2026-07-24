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

async function fetchCreatorReviewTasks() {
  const res = await fetch('/api/creator-review/tasks');
  if (!res.ok) throw new Error(`Creator review request failed: ${res.status}`);
  return res.json() as Promise<{
    dataMode: string;
    tasks: Array<Record<string, unknown>>;
  }>;
}

const ACTIONS = ['accept', 'edit', 'reject', 'uncertain', 'dismiss'] as const;
const CREATOR_ACTIONS = ['accept', 'reject', 'dismiss'] as const;

export function ReviewQueuePage() {
  const intel = useAsync(() => fetchReviewTasks(), []);
  const creator = useAsync(() => fetchCreatorReviewTasks(), []);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editText, setEditText] = useState<Record<string, string>>({});

  async function resolve(
    taskId: string,
    action: (typeof ACTIONS)[number],
    expectedAnalysisId?: string,
  ) {
    setBusyId(taskId);
    setMessage(null);
    try {
      await resolveReviewTask(taskId, {
        action,
        editedClaimText: action === 'edit' ? editText[taskId] : undefined,
        expectedAnalysisId,
      });
      setMessage(`Resolved intelligence task with ${action}`);
      intel.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Resolve failed');
    } finally {
      setBusyId(null);
    }
  }

  async function resolveCreator(taskId: string, action: (typeof CREATOR_ACTIONS)[number]) {
    setBusyId(taskId);
    setMessage(null);
    try {
      const res = await fetch(`/api/creator-review/tasks/${taskId}/resolve`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) throw new Error(String(body.error ?? `Resolve failed: ${res.status}`));
      setMessage(
        action === 'accept'
          ? 'Accepted finding for Live profile publication (still claim-scoped — no person score).'
          : `Creator finding ${action}ed — not published to profile.`,
      );
      creator.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Creator resolve failed');
    } finally {
      setBusyId(null);
    }
  }

  if (intel.loading && creator.loading) {
    return (
      <div className="space-y-3">
        <SkeletonBlock className="h-10 w-64" />
        <SkeletonBlock className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Review Queue"
        description="Intelligence extractions and creator-alignment candidate findings. Adverse creator findings require human accept before Live profile prominence. No person trust scores."
      />
      {intel.error ? <p className="text-rose-300">{intel.error}</p> : null}
      {creator.error ? <p className="text-rose-300">{creator.error}</p> : null}
      {message ? <p className="text-sm text-teal-300">{message}</p> : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Creator alignment findings</h2>
        {(creator.data?.tasks ?? []).length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No open creator alignment review tasks.</p>
        ) : (
          <ul className="space-y-3">
            {(creator.data?.tasks ?? []).map((task) => {
              const id = String(task.id);
              return (
                <li key={id} className="rounded-lg border border-[var(--border)] px-3 py-3">
                  <p className="font-medium">{String(task.title)}</p>
                  <p className="text-sm text-[var(--muted)]">{String(task.reason)}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {String(task.findingType)} · {String(task.status)}
                    {task.creatorId ? (
                      <>
                        {' · '}
                        <Link className="underline" to={`/creators/${String(task.creatorId)}`}>
                          creator
                        </Link>
                      </>
                    ) : null}
                  </p>
                  <div
                    className="mt-2 flex flex-wrap gap-2"
                    role="group"
                    aria-label={`Resolve creator ${id}`}
                  >
                    {CREATOR_ACTIONS.map((action) => (
                      <button
                        key={action}
                        type="button"
                        disabled={busyId === id}
                        className="rounded-md border border-[var(--border)] px-2 py-1 text-xs capitalize disabled:opacity-50"
                        onClick={() => void resolveCreator(id, action)}
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
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Intelligence review tasks</h2>
        {(intel.data?.tasks ?? []).length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No open Live intelligence review tasks.</p>
        ) : (
          <ul className="space-y-3">
            {(intel.data?.tasks ?? []).map((task) => {
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
      </section>
    </div>
  );
}
