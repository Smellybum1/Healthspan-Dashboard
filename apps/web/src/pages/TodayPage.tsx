import { Link } from 'react-router-dom';
import { DemoBanner, SectionCard, SkeletonBlock } from '@healthspan/ui';
import { EvidenceMaturityBadge, SafetyBadge } from '@healthspan/ui';
import { fetchDashboard } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { SignalRadar } from '../components/SignalRadar';
import { PageHeader } from '../components/Common';
import { formatWhen, itemPath } from '../lib/nav';
import { usePreferences } from '../state/PreferencesContext';
import { useCallback, useEffect, useRef, useState } from 'react';
import { m6Api } from '../lib/m6Api';

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

type PersonalisedSections = {
  urgentAlerts?: Array<Record<string, unknown>>;
  sinceLastVisit?: {
    items?: Array<Record<string, unknown>>;
    previousVisitAt?: number | null;
    firstVisit?: boolean;
  };
  latestDailyBrief?: Record<string, unknown> | null;
  watchlistChanges?: Array<Record<string, unknown>>;
  continueReading?: Array<Record<string, unknown>>;
  newSavedSearchMatches?: Array<Record<string, unknown>>;
  sourceCoverage?: Record<string, unknown>;
};

function TodayRowActions({
  kind,
  id,
  watchableId,
  targetType,
  targetId,
  whyIncluded,
  onDone,
}: {
  kind: 'alert' | 'reading' | 'change';
  id: string;
  watchableId?: string;
  targetType?: string;
  targetId?: string;
  whyIncluded?: unknown;
  onDone: () => void;
}) {
  return (
    <div className="mt-1 space-y-1">
      {whyIncluded != null ? (
        <details>
          <summary className="cursor-pointer text-xs text-[var(--muted)]">Why included</summary>
          <dl className="mt-1 grid gap-1 text-xs">
            {Object.entries(
              typeof whyIncluded === 'object' && whyIncluded
                ? (whyIncluded as Record<string, unknown>)
                : { reason: String(whyIncluded) },
            ).map(([k, v]) => (
              <div key={k} className="flex flex-wrap gap-1">
                <dt className="font-medium text-[var(--muted)]">{k}:</dt>
                <dd>{typeof v === 'string' ? v : JSON.stringify(v)}</dd>
              </div>
            ))}
          </dl>
        </details>
      ) : null}
      <div className="flex flex-wrap gap-2 text-xs">
        {kind === 'alert' ? (
          <>
            <button
              type="button"
              className="underline"
              onClick={() => void m6Api.alertAction(id, 'read').then(onDone)}
            >
              Mark read
            </button>
            <button
              type="button"
              className="underline"
              onClick={() => void m6Api.alertAction(id, 'dismiss').then(onDone)}
            >
              Dismiss
            </button>
            <button
              type="button"
              className="underline"
              onClick={() =>
                void m6Api
                  .createMute({ scopeType: 'object', scopeId: id, reason: 'muted from Today' })
                  .then(onDone)
              }
            >
              Mute
            </button>
          </>
        ) : (
          <>
            {targetType && targetId ? (
              <button
                type="button"
                className="underline"
                onClick={() =>
                  void m6Api
                    .follow({
                      targetType,
                      targetId,
                      displayTitle: targetId,
                    })
                    .then(onDone)
                }
              >
                Watch
              </button>
            ) : null}
            <button
              type="button"
              className="underline"
              onClick={() => {
                if (!watchableId) return;
                void m6Api.setReadingState(watchableId, 'read').then(onDone);
              }}
            >
              Mark read
            </button>
            <button
              type="button"
              className="underline"
              onClick={() => {
                if (!watchableId) return;
                void m6Api.setReadingState(watchableId, 'dismissed').then(onDone);
              }}
            >
              Dismiss
            </button>
            <button
              type="button"
              className="underline"
              onClick={() =>
                void m6Api
                  .createMute({
                    scopeType: watchableId ? 'watchable' : 'event_type',
                    scopeId: watchableId ?? id,
                    reason: 'muted from Today',
                  })
                  .then(onDone)
              }
            >
              Mute
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function TodayPage() {
  const { data, loading, error, reload } = useAsync(() => fetchDashboard(), []);
  const { prefs, markVisit } = usePreferences();
  const visitedRef = useRef(false);
  const [sections, setSections] = useState<PersonalisedSections>({});

  const loadPersonalised = useCallback(async () => {
    const res = await m6Api.personalisedToday();
    setSections((res.sections ?? res) as PersonalisedSections);
  }, []);

  useEffect(() => {
    if (data && !visitedRef.current) {
      visitedRef.current = true;
      const isLive = data.dataMode === 'live' || data.dataOrigin === 'live';
      if (isLive) {
        void m6Api.startVisit().catch(() => undefined);
        void loadPersonalised().catch(() => undefined);
      } else {
        markVisit();
      }
    }
  }, [data, markVisit, loadPersonalised]);

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
    return <p className="text-[var(--tone-flag-fg)]">Failed to load dashboard: {error}</p>;
  }

  const isLive = data.dataMode === 'live' || data.dataOrigin === 'live';
  const since = sections.sinceLastVisit ?? { items: [] };
  const coverage = sections.sourceCoverage ?? {};

  return (
    <div className="space-y-4">
      <PageHeader
        title="Today"
        description={
          isLive
            ? 'Live primary-source scan with evidence intelligence, intervention dossiers, and scoped regulatory coverage.'
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
          <button
            type="button"
            className="underline"
            onClick={() => {
              void reload();
              void loadPersonalised();
            }}
          >
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
          <p className="text-xs text-[var(--muted)]">Previous visit</p>
          <p className="text-sm font-medium">
            {isLive
              ? formatWhen(
                  since.previousVisitAt
                    ? new Date(since.previousVisitAt).toISOString()
                    : data.lastVisitAt,
                )
              : formatWhen(prefs.lastVisitAt ?? data.lastVisitAt)}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--muted)]">Source health</p>
          <p className="text-sm font-medium">
            {data.sources.filter((s) => s.health === 'healthy').length} healthy /{' '}
            {data.sources.length} sources
          </p>
        </div>
      </div>

      {isLive ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <SectionCard
            title="Urgent alerts"
            description="High-priority items from Alert Centre."
            emphasis="primary"
          >
            {(sections.urgentAlerts ?? []).length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No urgent alerts.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {(sections.urgentAlerts ?? []).map((a) => (
                  <li key={String(a.id)} className="rounded border border-[var(--border)] p-2">
                    <Link className="font-medium underline" to={`/alerts/${String(a.id)}`}>
                      {String(a.title)}
                    </Link>
                    <TodayRowActions
                      kind="alert"
                      id={String(a.id)}
                      whyIncluded={a.whyIncluded ?? a.whyIncludedJson}
                      onDone={() => void loadPersonalised()}
                    />
                  </li>
                ))}
              </ul>
            )}
            <Link className="mt-2 inline-block text-xs underline" to="/alerts">
              Open Alert Centre
            </Link>
          </SectionCard>

          <SectionCard
            title="Since last visit"
            description="Material changes since previous visit."
          >
            {(since.items ?? []).length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                {since.firstVisit
                  ? 'First visit — no prior cutoff yet.'
                  : 'No changes since previous visit.'}
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {(since.items ?? []).slice(0, 8).map((item) => (
                  <li key={String(item.id)} className="rounded border border-[var(--border)] p-2">
                    <p>{String(item.title ?? item.id)}</p>
                    <TodayRowActions
                      kind="change"
                      id={String(item.id)}
                      watchableId={item.watchableId ? String(item.watchableId) : undefined}
                      targetType={item.targetType ? String(item.targetType) : undefined}
                      targetId={item.targetId ? String(item.targetId) : String(item.id)}
                      whyIncluded={item.whyIncluded ?? item.reason}
                      onDone={() => void loadPersonalised()}
                    />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Latest daily brief" description="Most recent daily briefing.">
            {!sections.latestDailyBrief ? (
              <p className="text-sm text-[var(--muted)]">No daily brief yet.</p>
            ) : (
              <div className="text-sm">
                <Link
                  className="font-medium underline"
                  to={`/briefs/${String(sections.latestDailyBrief.id)}`}
                >
                  {String(sections.latestDailyBrief.title ?? 'Daily brief')}
                </Link>
                <p className="text-xs text-[var(--muted)]">
                  {formatWhen(new Date(Number(sections.latestDailyBrief.createdAt)).toISOString())}
                </p>
              </div>
            )}
            <Link className="mt-2 inline-block text-xs underline" to="/briefs">
              Open Briefings
            </Link>
          </SectionCard>

          <SectionCard title="Watchlist changes" description="Recent watchlist activity.">
            {(sections.watchlistChanges ?? []).length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No recent watchlist changes.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {(sections.watchlistChanges ?? []).slice(0, 8).map((c) => {
                  const w = c.watchable as Record<string, unknown> | undefined;
                  return (
                    <li key={String(c.id)} className="rounded border border-[var(--border)] p-2">
                      <p>
                        {String(c.watchlistName ?? 'Watchlist')}:{' '}
                        {String(w?.displayTitle ?? c.watchableId)}
                      </p>
                      <TodayRowActions
                        kind="change"
                        id={String(c.id)}
                        watchableId={c.watchableId ? String(c.watchableId) : undefined}
                        targetType={w?.targetType ? String(w.targetType) : undefined}
                        targetId={w?.targetId ? String(w.targetId) : undefined}
                        whyIncluded={c.whyIncluded ?? { watchlist: c.watchlistName }}
                        onDone={() => void loadPersonalised()}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
            <Link className="mt-2 inline-block text-xs underline" to="/watchlists">
              Open Watchlists
            </Link>
          </SectionCard>

          <SectionCard title="Continue reading" description="Opened items not yet finished.">
            {(sections.continueReading ?? []).length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Nothing in progress.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {(sections.continueReading ?? []).slice(0, 8).map((r) => (
                  <li key={String(r.id)} className="rounded border border-[var(--border)] p-2">
                    <p>{String(r.watchableId)}</p>
                    <TodayRowActions
                      kind="reading"
                      id={String(r.id)}
                      watchableId={String(r.watchableId)}
                      whyIncluded={r.whyIncluded ?? { surface: 'continue_reading' }}
                      onDone={() => void loadPersonalised()}
                    />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="New saved-search matches"
            description="Fresh matches from active searches."
          >
            {(sections.newSavedSearchMatches ?? []).length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No new saved-search matches.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {(sections.newSavedSearchMatches ?? []).slice(0, 8).map((m, idx) => (
                  <li
                    key={`${String(m.savedSearchId)}-${idx}`}
                    className="rounded border border-[var(--border)] p-2"
                  >
                    <p>
                      {String(m.savedSearchName ?? 'Search')}: {String(m.watchableId ?? m.id)}
                    </p>
                    <TodayRowActions
                      kind="reading"
                      id={String(m.id ?? m.watchableId)}
                      watchableId={m.watchableId ? String(m.watchableId) : undefined}
                      whyIncluded={
                        m.whyIncluded ?? {
                          savedSearch: m.savedSearchName ?? m.savedSearchId,
                        }
                      }
                      onDone={() => void loadPersonalised()}
                    />
                  </li>
                ))}
              </ul>
            )}
            <Link className="mt-2 inline-block text-xs underline" to="/saved-searches">
              Open Saved Searches
            </Link>
          </SectionCard>

          <SectionCard title="Source coverage" description="Coverage from the latest daily brief.">
            <dl className="space-y-1 text-sm">
              <div>
                <dt className="text-[var(--muted)]">Sources seen</dt>
                <dd>{((coverage.sourcesSeen as string[]) ?? []).join(', ') || '—'}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Selected / candidates</dt>
                <dd>
                  {String(coverage.selectedCount ?? '—')} / {String(coverage.candidateCount ?? '—')}
                </dd>
              </div>
              {((coverage.partialReasons as string[]) ?? []).length > 0 ? (
                <div>
                  <dt className="text-[var(--muted)]">Partial reasons</dt>
                  <dd>{((coverage.partialReasons as string[]) ?? []).join(', ')}</dd>
                </div>
              ) : null}
            </dl>
          </SectionCard>
        </div>
      ) : null}

      <SectionCard
        emphasis="primary"
        title="What changed since last visit"
        description={
          isLive
            ? 'Non-baseline deterministic change events from live ingestion.'
            : 'Status changes beat volume.'
        }
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
              <li
                key={change.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-[var(--surface)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--muted)]">
                    {change.kind.replaceAll('_', ' ')}
                  </span>
                  <span className="text-[10px] uppercase text-[var(--muted)]">
                    {change.importance}
                  </span>
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
        {isLive && data.radar.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
            {data.radarUnavailableReason ??
              'No Live evidence analyses yet. Run intelligence analysis after ingestion.'}
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
          {data.interventionWatch.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              {isLive
                ? 'No non-baseline dossier changes yet. Rebuild or enrich a Live intervention dossier to populate this feed.'
                : 'No intervention watch items in this demo snapshot.'}
            </p>
          ) : (
            <ul className="space-y-2">
              {data.interventionWatch.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      className="font-medium hover:underline"
                      to={
                        'href' in item && typeof item.href === 'string'
                          ? item.href
                          : itemPath(item.type, item.id)
                      }
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs text-[var(--muted)]">{item.summary}</p>
                    {isLiveBrief(item) && item.meta ? (
                      <p className="text-[10px] uppercase text-[var(--muted)]">{item.meta}</p>
                    ) : null}
                  </div>
                  {'unapprovedWarning' in item && item.unapprovedWarning ? (
                    <span className="shrink-0 text-[10px] uppercase text-[var(--tone-flag-fg)]">
                      Unapproved
                    </span>
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
                        <span className="ml-2 text-xs text-[var(--muted)]">
                          {paper.peerReviewStatus}
                        </span>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Creator Claims">
          {data.creatorClaims.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              {isLive
                ? 'No Live creator claims yet. Import an authorised transcript/document for a curated creator.'
                : 'No creator claims in this demo snapshot.'}
            </p>
          ) : (
            <ul className="space-y-2">
              {data.creatorClaims.map((claim) => (
                <li key={claim.id}>
                  <Link
                    className="font-medium hover:underline"
                    to={
                      'href' in claim && typeof claim.href === 'string'
                        ? claim.href
                        : itemPath('claim', claim.id)
                    }
                  >
                    {claim.title}
                  </Link>
                  {isLiveBrief(claim) ? (
                    <p className="text-xs text-[var(--muted)]">{claim.summary ?? claim.meta}</p>
                  ) : (
                    <>
                      <p className="text-sm text-[var(--muted)]">
                        {'claimText' in claim ? String(claim.claimText) : ''}
                      </p>
                      {'evidenceAttentionDivergence' in claim ? (
                        <p className="text-xs text-[var(--muted)]">
                          Divergence:{' '}
                          {String(claim.evidenceAttentionDivergence).replaceAll('_', ' ')}
                        </p>
                      ) : null}
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Needs Review" emphasis="utility">
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

      <SectionCard title="Source Health summary" emphasis="utility">
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {data.sources.map((source) => (
            <li
              key={source.id}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            >
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
