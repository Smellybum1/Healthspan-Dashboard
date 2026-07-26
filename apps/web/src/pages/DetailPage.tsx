import { Link, useParams } from 'react-router-dom';
import { DemoBanner, SkeletonBlock } from '@healthspan/ui';
import { fetchItem } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { AssessmentPanel, FollowButton, PageHeader } from '../components/Common';
import { formatWhen } from '../lib/nav';

type DetailRecord = {
  id: string;
  type: string;
  title: string;
  summary: string;
  tags: string[];
  updatedAt: string;
  unapprovedWarning?: boolean;
  canonicalName?: string;
  aliases?: string[];
  peerReviewStatus?: string;
  studyDesign?: string;
  findingDirection?: string;
  registryId?: string;
  registryUrl?: string;
  status?: string;
  jurisdiction?: string;
  authority?: string;
  handle?: string;
  isCorrectionOrRetraction?: boolean;
  correctionNote?: string;
  claimedPurpose?: string;
  demonstratedIndications?: string[];
  statusHistory?: Array<{ status: string; at: string; note?: string }>;
  locations?: Array<{ country: string; city?: string; australiaRelevant?: boolean }>;
  relatedPaperIds?: string[];
  relatedTrialIds?: string[];
};

export function DetailPage() {
  const { id = '' } = useParams();
  const { data, loading, error } = useAsync(() => fetchItem(id), [id]);

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonBlock className="h-10 w-80" />
        <SkeletonBlock className="h-40 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="text-[var(--tone-flag-fg)]">Unable to load item: {error ?? 'Not found'}</p>
    );
  }

  const item = data.item as DetailRecord;
  const { assessment, demoNotice } = data;
  const isPeptide = item.type === 'peptide' || Boolean(item.unapprovedWarning);

  return (
    <div className="space-y-4">
      <PageHeader
        title={item.title}
        description={item.summary}
        actions={<FollowButton id={item.id} />}
      />
      {demoNotice ? <DemoBanner notice={demoNotice} /> : null}
      {data.assessmentStatus ? (
        <p className="text-sm text-[var(--muted)]">{data.assessmentStatus}</p>
      ) : null}
      {'liveAnalysis' in data && data.liveAnalysis ? (
        <section className="card space-y-2">
          <h2 className="t-section">Live evidence profile</h2>
          <p className="text-xs text-[var(--muted)]">
            Deterministic dimensions only — no composite longevity score.
          </p>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-[var(--muted)]">Evidence maturity</dt>
              <dd>
                {String((data.liveAnalysis as { evidenceMaturity: string }).evidenceMaturity)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--muted)]">Evidence availability</dt>
              <dd>
                {String(
                  (data.liveAnalysis as { evidenceAvailability: string }).evidenceAvailability,
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--muted)]">Classification confidence</dt>
              <dd>
                {String(
                  (data.liveAnalysis as { classificationConfidence: string })
                    .classificationConfidence,
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--muted)]">Research activity</dt>
              <dd>
                {String((data.liveAnalysis as { researchActivity: number }).researchActivity)}
              </dd>
            </div>
          </dl>
          <div>
            <p className="text-xs text-[var(--muted)]">What would change this assessment</p>
            <ul className="mt-1 list-disc pl-5 text-sm text-[var(--muted)]">
              {((data.liveAnalysis as { whatWouldChange?: string[] }).whatWouldChange ?? []).map(
                (line) => (
                  <li key={line}>{line}</li>
                ),
              )}
            </ul>
          </div>
        </section>
      ) : null}
      {'liveClaims' in data && Array.isArray(data.liveClaims) && data.liveClaims.length > 0 ? (
        <section className="card space-y-2">
          <h2 className="t-section">Live claims</h2>
          <ul className="space-y-2">
            {(data.liveClaims as Array<Record<string, unknown>>).map((claim) => (
              <li
                key={String(claim.id)}
                className="rounded-lg border border-[var(--border)] px-3 py-2"
              >
                <p className="text-sm font-medium">{String(claim.claimText)}</p>
                <p className="text-xs text-[var(--muted)]">
                  {String(claim.assertionRole)} · {String(claim.classificationConfidence)} ·{' '}
                  {String(claim.reviewStatus)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {isPeptide ? (
        <div
          role="alert"
          className="rounded-lg border border-[var(--tone-flag-ring)] bg-[var(--tone-flag-bg)] px-3 py-2 text-sm text-[var(--tone-flag-fg)]"
        >
          Strong warning: this is an unapproved / investigational peptide example for research
          intelligence only. Not a sourcing, dosing, prescribing, or enrolment recommendation.
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <section className="card">
            <h2 className="t-section">Overview</h2>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-[var(--muted)]">Type</dt>
                <dd>{item.type.replaceAll('_', ' ')}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--muted)]">Updated</dt>
                <dd>{formatWhen(item.updatedAt)}</dd>
              </div>
              {item.canonicalName ? (
                <div>
                  <dt className="text-xs text-[var(--muted)]">Canonical name</dt>
                  <dd>{item.canonicalName}</dd>
                </div>
              ) : null}
              {item.aliases ? (
                <div>
                  <dt className="text-xs text-[var(--muted)]">Aliases</dt>
                  <dd>{item.aliases.join(', ') || '—'}</dd>
                </div>
              ) : null}
              {item.peerReviewStatus ? (
                <div>
                  <dt className="text-xs text-[var(--muted)]">Peer review</dt>
                  <dd>{item.peerReviewStatus.replaceAll('_', ' ')}</dd>
                </div>
              ) : null}
              {item.studyDesign ? (
                <div>
                  <dt className="text-xs text-[var(--muted)]">Study design</dt>
                  <dd>{item.studyDesign.replaceAll('_', ' ')}</dd>
                </div>
              ) : null}
              {item.findingDirection ? (
                <div>
                  <dt className="text-xs text-[var(--muted)]">Finding direction</dt>
                  <dd>{item.findingDirection}</dd>
                </div>
              ) : null}
              {item.registryId ? (
                <div>
                  <dt className="text-xs text-[var(--muted)]">Registry</dt>
                  <dd>
                    <a
                      className="underline"
                      href={item.registryUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.registryId}
                    </a>
                  </dd>
                </div>
              ) : null}
              {item.status ? (
                <div>
                  <dt className="text-xs text-[var(--muted)]">Trial status</dt>
                  <dd>{item.status.replaceAll('_', ' ')}</dd>
                </div>
              ) : null}
              {item.jurisdiction ? (
                <div>
                  <dt className="text-xs text-[var(--muted)]">Jurisdiction</dt>
                  <dd>{item.jurisdiction}</dd>
                </div>
              ) : null}
              {item.authority ? (
                <div>
                  <dt className="text-xs text-[var(--muted)]">Authority</dt>
                  <dd>{item.authority}</dd>
                </div>
              ) : null}
              {item.handle ? (
                <div>
                  <dt className="text-xs text-[var(--muted)]">Handle</dt>
                  <dd>{item.handle}</dd>
                </div>
              ) : null}
            </dl>

            {item.isCorrectionOrRetraction ? (
              <p className="mt-3 rounded-md border border-[var(--tone-flag-ring)] bg-[var(--tone-flag-bg)] px-3 py-2 text-sm">
                Correction/retraction example: {item.correctionNote ?? 'See record history.'}
              </p>
            ) : null}

            {item.claimedPurpose ? (
              <div className="mt-4 space-y-2 text-sm">
                <p>
                  <span className="text-[var(--muted)]">Claimed purpose:</span>{' '}
                  {item.claimedPurpose}
                </p>
                <p>
                  <span className="text-[var(--muted)]">Demonstrated indications:</span>{' '}
                  {item.demonstratedIndications?.length
                    ? item.demonstratedIndications.join('; ')
                    : 'None listed in demo snapshot'}
                </p>
              </div>
            ) : null}

            {item.statusHistory?.length ? (
              <div className="mt-4">
                <h3 className="text-xs font-medium text-[var(--muted)]">Status timeline</h3>
                <ol className="mt-2 space-y-1 text-sm">
                  {item.statusHistory.map((entry) => (
                    <li key={`${entry.at}-${entry.status}`}>
                      {formatWhen(entry.at)} — {entry.status.replaceAll('_', ' ')}
                      {entry.note ? ` (${entry.note})` : ''}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {item.locations?.length ? (
              <div className="mt-4 text-sm">
                <h3 className="text-xs font-medium text-[var(--muted)]">Locations</h3>
                <p>
                  {item.locations
                    .map((loc) => `${loc.city ? `${loc.city}, ` : ''}${loc.country}`)
                    .join(' · ')}
                </p>
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-[var(--surface-2)] px-2 py-0.5 text-xs text-[var(--muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>

          {item.relatedPaperIds?.length ? (
            <section className="card text-sm">
              <h2 className="t-section">Related papers</h2>
              <ul className="mt-2 list-disc pl-5">
                {item.relatedPaperIds.map((paperId) => (
                  <li key={paperId}>
                    <Link className="underline" to={`/research/${paperId}`}>
                      {paperId}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {item.relatedTrialIds?.length ? (
            <section className="card text-sm">
              <h2 className="t-section">Related trials</h2>
              <ul className="mt-2 list-disc pl-5">
                {item.relatedTrialIds.map((trialId) => (
                  <li key={trialId}>
                    <Link className="underline" to={`/trials/${trialId}`}>
                      {trialId}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {assessment ? (
          <AssessmentPanel assessment={assessment} />
        ) : (
          <p className="text-sm text-[var(--muted)]">No assessment attached.</p>
        )}
      </div>
    </div>
  );
}
