import { Link } from 'react-router-dom';
import { DemoBanner, SectionCard, SkeletonBlock } from '@healthspan/ui';
import { EvidenceMaturityBadge, SafetyBadge } from '@healthspan/ui';
import { fetchDashboard } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { SignalRadar } from '../components/SignalRadar';
import { PageHeader } from '../components/Common';
import { formatWhen, itemPath } from '../lib/nav';
import { usePreferences } from '../state/PreferencesContext';
import { useEffect, useRef } from 'react';

function isLiveBrief(item: { dataOrigin?: string; status?: unknown }): item is {
  id: string;
  type: string;
  title: string;
  summary?: string;
  meta?: string;
  dataOrigin: 'live';
} {
  return item.dataOrigin === 'live' && !('status' in item && item.status);
}

export function TodayPage() {
  const { data, loading, error, reload } = useAsync(() => fetchDashboard(), []);
  const { prefs, markVisit } = usePreferences();
  const visitedRef = useRef(false);

  useEffect(() => {
    if (data && !visitedRef.current) {
      visitedRef.current = true;
      markVisit();
    }
  }, [data, markVisit]);

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonBlock className="h-10 w-64" />
        <SkeletonBlock className="h-24 w-full" />
        <SkeletonBlock className="h-80 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-rose-300">Failed to load dashboard: {error}</p>;
  }

  const isLive = data.dataMode === 'live' || data.dataOrigin === 'live';

  return (
    <div className="space-y-4">
      <PageHeader
        title="Today"
        description={
          isLive
            ? 'Live primary-source scan. Evidence scores arrive in Milestone 3.'
            : 'A ten-minute scan of what changed, what is weakly evidenced but loud, and what is quietly strong.'
        }
      />
      {data.demoNotice ? <DemoBanner notice={data.demoNotice} /> : null}
      {isLive ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--muted)]">
          Data mode: <span className="font-medium text-[var(--fg)]">Live</span>
          {data.firstSyncRequired
            ? ' — no live records yet. Run first sync from Settings or Source Health.'
            : null}{' '}
          <button type="button" className="underline" onClick={() => void reload()}>
            Refresh
          </button>
        </div>
      ) : null}

      <div className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:grid-cols-3">
        <div>
          <p className="text-xs text-[var(--muted)]">As of</p>
          <p className="text-sm font-medium">{formatWhen(data.asOf)}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--muted)]">Previous visit (local)</p>
          <p className="text-sm font-medium">{formatWhen(prefs.lastVisitAt ?? data.lastVisitAt)}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--muted)]">Source health</p>
          <p className="text-sm font-medium">
            {data.sources.filter((s) => s.health === 'healthy').length} healthy / {data.sources.length}{' '}
            sources
          </p>
        </div>
      </div>

      <SectionCard
        title="What changed since last visit"
        description={isLive ? 'Non-baseline deterministic change events from live ingestion.' : 'Status changes beat volume.'}
      >
        {data.changes.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            {data.firstSyncRequired
              ? 'No change events yet. Complete a first sync to establish a baseline.'
              : 'No non-baseline changes detected yet.'}
          </p>
        ) : (
          <ul className="space-y-2">
            {data.changes.map((change) => (
              <li key={change.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-[var(--surface)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--muted)]">
                    {change.kind.replaceAll('_', ' ')}
                  </span>
                  <span className="text-[10px] uppercase text-[var(--muted)]">{change.importance}</span>
                </div>
                <p className="mt-1 font-medium">{change.title}</p>
                <p className="text-sm text-[var(--muted)]">{change.summary}</p>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard
        title="Signal Radar"
        description={
          isLive
            ? 'Deferred until Milestone 3 evidence classification.'
            : 'X = evidence maturity · Y = attention momentum · outline/red = safety concern'
        }
      >
        {isLive || data.radarUnavailableReason ? (
          <div className="rounded-lg border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
            {data.radarUnavailableReason ??
              'Live Signal Radar is unavailable. Evidence classification arrives in Milestone 3.'}
          </div>
        ) : (
          <SignalRadar points={data.radar} />
        )}
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Trial Pulse">
          {data.trialPulse.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No live trials ingested yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.trialPulse.slice(0, 6).map((trial) => (
                <li key={trial.id}>
                  <Link className="font-medium hover:underline" to={`/trials/${trial.id}`}>
                    {trial.title}
                  </Link>
                  <p className="text-xs text-[var(--muted)]">
                    {isLiveBrief(trial)
                      ? trial.meta
                      : `${'status' in trial ? String(trial.status).replaceAll('_', ' ') : ''} · ${
                          'registryId' in trial ? String(trial.registryId) : ''
                        }`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Intervention Watch">
          {isLive ? (
            <p className="text-sm text-[var(--muted)]">
              Intervention resolution arrives in a later milestone. Switch to Demo mode in Settings to
              explore the M1 showcase, or keep Live mode for primary-source papers, trials, and TGA
              alerts.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.interventionWatch.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-2">
                  <div>
                    <Link className="font-medium hover:underline" to={itemPath(item.type, item.id)}>
                      {item.title}
                    </Link>
                    <p className="text-xs text-[var(--muted)]">{item.summary}</p>
                  </div>
                  {'unapprovedWarning' in item && item.unapprovedWarning ? (
                    <span className="shrink-0 text-[10px] uppercase text-rose-300">Unapproved</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Safety & Regulation">
          {data.safetyEvents.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No matched TGA items yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.safetyEvents.map((event) => (
                <li key={event.id} className="flex flex-wrap items-center gap-2">
                  {!isLiveBrief(event) && 'severity' in event ? (
                    <SafetyBadge severity={event.severity} />
                  ) : (
                    <span className="text-[10px] uppercase text-[var(--muted)]">
                      {isLiveBrief(event) ? event.meta : 'TGA'}
                    </span>
                  )}
                  <Link className="font-medium hover:underline" to={`/safety?focus=${event.id}`}>
                    {event.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Research Brief">
          {data.researchBrief.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No live papers ingested yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.researchBrief.map((paper) => (
                <li key={paper.id}>
                  <Link className="font-medium hover:underline" to={`/research/${paper.id}`}>
                    {paper.title}
                  </Link>
                  <div className="mt-1">
                    {isLiveBrief(paper) ? (
                      <span className="text-xs text-[var(--muted)]">{paper.meta ?? 'PubMed'}</span>
                    ) : (
                      <>
                        <EvidenceMaturityBadge
                          maturity={
                            paper.peerReviewStatus === 'preprint'
                              ? 'early_human_interventional'
                              : paper.studyDesign === 'animal_experiment'
                                ? 'animal_model'
                                : paper.studyDesign === 'in_vitro'
                                  ? 'in_vitro_ex_vivo'
                                  : paper.studyDesign === 'systematic_review_meta_analysis'
                                    ? 'replicated_controlled_or_synthesis'
                                    : 'controlled_clinical_trial'
                          }
                        />
                        <span className="ml-2 text-xs text-[var(--muted)]">{paper.peerReviewStatus}</span>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Creator Claims">
          {isLive ? (
            <p className="text-sm text-[var(--muted)]">
              Creator monitoring is not part of Milestone 2. Demo mode retains the M1 claim showcase.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.creatorClaims.map((claim) => (
                <li key={claim.id}>
                  <p className="font-medium">{claim.title}</p>
                  <p className="text-sm text-[var(--muted)]">{claim.claimText}</p>
                  <p className="text-xs text-[var(--muted)]">
                    Divergence: {claim.evidenceAttentionDivergence.replaceAll('_', ' ')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Needs Review">
          {isLive ? (
            <p className="text-sm text-[var(--muted)]">
              Review-queue automation arrives with later intelligence milestones.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.needsReview.map((task) => (
                <li key={task.id} className="rounded-lg border border-[var(--border)] px-3 py-2">
                  <p className="font-medium">{task.title}</p>
                  <p className="text-sm text-[var(--muted)]">{task.reason}</p>
                  <p className="text-xs text-[var(--muted)]">
                    Confidence {Math.round(task.confidence * 100)}% · {task.status}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Source Health summary">
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {data.sources.map((source) => (
            <li key={source.id} className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
              <p className="font-medium">{source.name}</p>
              <p className="text-xs text-[var(--muted)]">
                {source.health}
                {source.lastError ? ` — ${source.lastError}` : ''}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-[var(--muted)]">
          <Link className="underline" to="/sources">
            Open Source Health
          </Link>
        </p>
      </SectionCard>
    </div>
  );
}
