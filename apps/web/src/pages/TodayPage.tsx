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

export function TodayPage() {
  const { data, loading, error } = useAsync(() => fetchDashboard(), []);
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

  return (
    <div className="space-y-4">
      <PageHeader
        title="Today"
        description="A ten-minute scan of what changed, what is weakly evidenced but loud, and what is quietly strong."
      />
      <DemoBanner notice={data.demoNotice} />

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
            {data.sources.filter((s) => s.health === 'healthy').length} healthy / {data.sources.length} sources
            (M1 stubs)
          </p>
        </div>
      </div>

      <SectionCard title="What changed since last visit" description="Status changes beat volume.">
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
      </SectionCard>

      <SectionCard
        title="Signal Radar"
        description="X = evidence maturity · Y = attention momentum · outline/red = safety concern"
      >
        <SignalRadar points={data.radar} />
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Trial Pulse">
          <ul className="space-y-2">
            {data.trialPulse.slice(0, 6).map((trial) => (
              <li key={trial.id}>
                <Link className="font-medium hover:underline" to={`/trials/${trial.id}`}>
                  {trial.title}
                </Link>
                <p className="text-xs text-[var(--muted)]">
                  {trial.status.replaceAll('_', ' ')} · {trial.registryId}
                  {trial.locations.some((l) => l.australiaRelevant) ? ' · Australia' : ''}
                </p>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Intervention Watch">
          <ul className="space-y-2">
            {data.interventionWatch.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    className="font-medium hover:underline"
                    to={itemPath(item.type, item.id)}
                  >
                    {item.title}
                  </Link>
                  <p className="text-xs text-[var(--muted)]">{item.summary}</p>
                </div>
                {item.unapprovedWarning ? (
                  <span className="shrink-0 text-[10px] uppercase text-rose-300">Unapproved</span>
                ) : null}
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Safety & Regulation">
          <ul className="space-y-2">
            {data.safetyEvents.map((event) => (
              <li key={event.id} className="flex flex-wrap items-center gap-2">
                <SafetyBadge severity={event.severity} />
                <Link className="font-medium hover:underline" to={`/safety?focus=${event.id}`}>
                  {event.title}
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Research Brief">
          <ul className="space-y-2">
            {data.researchBrief.map((paper) => (
              <li key={paper.id}>
                <Link className="font-medium hover:underline" to={`/research/${paper.id}`}>
                  {paper.title}
                </Link>
                <div className="mt-1">
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
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Creator Claims">
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
        </SectionCard>

        <SectionCard title="Needs Review">
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
      </SectionCard>
    </div>
  );
}
