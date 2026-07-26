import { PageHeader } from '../components/Common';
import { useAsync } from '../hooks/useAsync';
import { fetchIngestionRuns, fetchSources, runIngestion, fetchJob, apiFetch } from '../lib/api';
import { formatWhen } from '../lib/nav';
import { useState } from 'react';
import { SkeletonBlock } from '@healthspan/ui';

export function SourceHealthPage() {
  const sources = useAsync(() => fetchSources(), []);
  const runs = useAsync(() => fetchIngestionRuns(), []);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function sync(sourceId: string) {
    setBusy(true);
    setMessage(`Queueing ingestion for ${sourceId}…`);
    try {
      const accepted = await runIngestion({ sourceId, recordCap: 25 });
      const jobId = String(accepted.jobId ?? '');
      setMessage(`Accepted job ${jobId} (${String(accepted.status)})`);
      if (jobId) {
        for (let i = 0; i < 40; i += 1) {
          await new Promise((r) => setTimeout(r, 500));
          const job = await fetchJob(jobId);
          setMessage(`Job ${jobId}: ${job.status}`);
          if (['succeeded', 'partial', 'failed', 'cancelled'].includes(String(job.status))) break;
        }
      }
      sources.reload();
      runs.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Ingestion failed');
    } finally {
      setBusy(false);
    }
  }

  if (sources.loading) {
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
        title="Source Health"
        description="Operational status for primary sources plus FDA bulk / Purple Book due times and creator-platform connectors. Live SQLite only — never mixed with Demo seed."
      />

      {sources.data ? (
        <p className="text-xs text-[var(--muted)]">
          Exact local database paths are intentionally hidden from the browser. Use{' '}
          <code>pnpm data:path</code> in a terminal.
        </p>
      ) : null}

      <section className="card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="t-section">Sources</h2>
          <button
            type="button"
            disabled={busy}
            onClick={() => void sync('all')}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Sync all
          </button>
        </div>
        <ul className="grid gap-2 md:grid-cols-2">
          {(sources.data?.sources ?? []).map((source) => (
            <li
              key={String(source.id)}
              className="rounded-lg border border-[var(--border)] px-3 py-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {String(source.displayName ?? source.name ?? source.id)}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {String(source.health ?? source.healthState)} · failures{' '}
                    {String(source.consecutiveFailures ?? 0)}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    Last success:{' '}
                    {formatWhen(source.lastSuccessfulFetchAt as string | null | undefined)}
                  </p>
                  {source.nextRunAt ? (
                    <p className="text-xs text-[var(--muted)]">
                      Next due: {formatWhen(source.nextRunAt as string)} (
                      {String(source.scheduleCadence)})
                    </p>
                  ) : null}
                  {source.scheduleNotes ? (
                    <p className="text-xs text-[var(--muted)]">{String(source.scheduleNotes)}</p>
                  ) : null}
                  {source.lastError ? (
                    <p className="text-xs text-[var(--tone-flag-fg)]">{String(source.lastError)}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={busy}
                  className="shrink-0 rounded-lg border border-[var(--border)] px-2 py-1 text-xs disabled:opacity-50"
                  onClick={() => void sync(String(source.id))}
                >
                  Sync
                </button>
              </div>
            </li>
          ))}
        </ul>
        {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}
      </section>

      {(sources.data?.feeds?.length ?? 0) > 0 ? (
        <section className="card space-y-2">
          <h2 className="t-section">TGA feeds</h2>
          <ul className="space-y-1 text-sm">
            {sources.data?.feeds.map((feed) => (
              <li key={String(feed.id)} className="text-[var(--muted)]">
                <span className="text-[var(--fg)]">{String(feed.feedKey)}</span> ·{' '}
                {String(feed.url)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="card space-y-2">
        <h2 className="t-section">Recent ingestion runs</h2>
        {(runs.data?.runs ?? []).length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No runs yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {(runs.data?.runs ?? []).slice(0, 12).map((run) => (
              <li
                key={String(run.id)}
                className="rounded-lg border border-[var(--border)] px-3 py-2"
              >
                <p className="font-medium">
                  {String(run.sourceId ?? 'all')} · {String(run.status)} · {String(run.trigger)}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {formatWhen(run.startedAt as string)} · fetched{' '}
                  {String(run.remoteRecordCount ?? 0)} · changes {String(run.changeEventCount ?? 0)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <PlatformPolicyHealth />
    </div>
  );
}

function PlatformPolicyHealth() {
  const policy = useAsync(async () => {
    const res = await apiFetch('/api/platform-policy');
    if (!res.ok) throw new Error(`platform-policy ${res.status}`);
    return res.json() as Promise<Record<string, unknown>>;
  }, []);

  if (policy.loading) return <SkeletonBlock className="h-32 w-full" />;
  if (!policy.data) return null;

  const yt = policy.data.youtube as Record<string, unknown> | undefined;
  const x = policy.data.x as Record<string, unknown> | undefined;
  const quota = (yt?.quota ?? {}) as Record<string, unknown>;
  const budget = (x?.budget ?? {}) as Record<string, unknown>;
  const compliance = (x?.compliance ?? {}) as Record<string, unknown>;
  const audits = (policy.data.audits as Array<Record<string, unknown>> | undefined) ?? [];

  return (
    <section className="card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="t-section">Creator platform health</h2>
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
          onClick={() => {
            void apiFetch('/api/platform-policy/audit', { method: 'POST' }).then(() =>
              policy.reload(),
            );
          }}
        >
          Run policy audit
        </button>
      </div>
      <div className="grid gap-2 md:grid-cols-2 text-sm">
        <div className="rounded-lg border border-[var(--border)] px-3 py-2">
          <p className="font-medium">YouTube</p>
          <p className="text-xs text-[var(--muted)]">
            Metadata never claim evidence · quota {String(quota.status ?? 'unknown')} · units{' '}
            {String(quota.unitsSpentToday ?? quota.spentUnits ?? 0)}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--border)] px-3 py-2">
          <p className="font-medium">X</p>
          <p className="text-xs text-[var(--muted)]">
            Budget {String(budget.status ?? 'disabled')} · compliance{' '}
            {compliance.overdue ? 'overdue' : 'ok'} · external AI never allowed
          </p>
        </div>
      </div>
      {audits.length > 0 ? (
        <ul className="space-y-1 text-xs text-[var(--muted)]">
          {audits.slice(0, 8).map((a) => (
            <li key={String(a.id)}>
              [{String(a.severity)}] {String(a.issue)} · {String(a.severity)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-[var(--muted)]">No open platform-policy audit findings.</p>
      )}
    </section>
  );
}
