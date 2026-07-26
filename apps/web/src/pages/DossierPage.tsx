import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/Common';
import { useAsync } from '../hooks/useAsync';
import { SkeletonBlock } from '@healthspan/ui';
import { itemPath } from '../lib/nav';

async function fetchDossier(id: string) {
  const res = await fetch(`/api/interventions/${id}/dossier`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<{
    entity: Record<string, unknown>;
    aliases: Array<Record<string, unknown>>;
    summary: Record<string, unknown>;
    evidenceMap: {
      analyses: Array<Record<string, unknown>>;
      claims: Array<Record<string, unknown>>;
    };
    regulatoryMatrix: Record<string, unknown>;
    safety: Record<string, unknown>;
    snapshotId: string;
    openResolutionTasks: number;
  }>;
}

export function DossierPage() {
  const { id = '' } = useParams();
  const { data, loading, error } = useAsync(() => fetchDossier(id), [id]);

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonBlock className="h-10 w-64" />
        <SkeletonBlock className="h-40 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-[var(--tone-flag-fg)]">{error ?? 'Dossier not found'}</p>;
  }

  const entity = data.entity;
  return (
    <div className="space-y-4">
      <PageHeader
        title={String(entity.preferredName)}
        description={`${String(entity.entityType)} dossier · identity ${String(entity.identityConfidence)} · snapshot ${data.snapshotId.slice(0, 8)}`}
      />
      <p className="text-sm text-[var(--muted)]">{String(entity.shortDescription ?? '')}</p>
      <p className="text-xs text-[var(--muted)]">{String(data.summary.provenanceNote ?? '')}</p>

      <section>
        <h2 className="mb-2 t-label">Aliases</h2>
        <ul className="flex flex-wrap gap-2 text-sm">
          {data.aliases.map((a) => (
            <li
              key={String(a.aliasText)}
              className="rounded border border-[var(--border)] px-2 py-1"
            >
              {String(a.aliasText)}
            </li>
          ))}
        </ul>
      </section>

      {data.summary.peptide ? (
        <section className="rounded border border-[var(--tone-watch-ring)] px-3 py-2 text-sm">
          <p className="font-medium">Peptide identity</p>
          <p>
            {String((data.summary.peptide as Record<string, unknown>).classification)} · sequence{' '}
            {String((data.summary.peptide as Record<string, unknown>).sequenceState)} · warning{' '}
            {String((data.summary.peptide as Record<string, unknown>).warningState)}
          </p>
          <p className="text-[var(--muted)]">
            {String((data.summary.peptide as Record<string, unknown>).note)}
          </p>
          <p className="text-xs text-[var(--muted)]">
            No dosing, vendors, stacking, or treatment advice.
          </p>
        </section>
      ) : null}

      <section>
        <h2 className="mb-2 t-label">Evidence map (M3-linked)</h2>
        <p className="mb-2 text-sm text-[var(--muted)]">
          {String(data.summary.linkedAnalysisCount)} analyses ·{' '}
          {String(data.summary.linkedClaimCount)} claims · {String(data.summary.linkedContentCount)}{' '}
          content items
        </p>
        <ul className="space-y-2 text-sm">
          {data.evidenceMap.analyses.map((a) => (
            <li
              key={String(a.analysisId)}
              className="rounded border border-[var(--border)] px-3 py-2"
            >
              <Link className="underline" to={itemPath('paper', String(a.contentItemId))}>
                Analysis {String(a.analysisId).slice(0, 8)}
              </Link>
              <p className="text-xs text-[var(--muted)]">
                {String(a.evidenceMaturity)} · {String(a.evidenceAvailability)} ·{' '}
                {String(a.studyDesign)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 t-label">Regulatory matrix</h2>
        <p className="text-sm text-[var(--muted)]">{String(data.regulatoryMatrix.caveat)}</p>
        <ul className="mt-2 space-y-1 text-sm">
          {(
            (data.regulatoryMatrix.coverage as Array<Record<string, unknown>> | undefined) ?? []
          ).map((c) => (
            <li
              key={String(c.sourceId)}
              className="rounded border border-[var(--border)] px-3 py-1.5"
            >
              <span className="font-medium">{String(c.sourceId)}</span>
              {c.jurisdiction ? ` · ${String(c.jurisdiction)}` : ''} · {String(c.state)}
              <p className="text-xs text-[var(--muted)]">{String(c.note)}</p>
            </li>
          ))}
        </ul>
        <ul className="mt-2 space-y-2 text-sm">
          {(
            (data.regulatoryMatrix.assertions as Array<Record<string, unknown>> | undefined) ?? []
          ).map((a) => (
            <li key={String(a.id)} className="rounded border border-[var(--border)] px-3 py-2">
              {String(a.jurisdiction)} / {String(a.authority)} · {String(a.normalizedStanding)} ·{' '}
              {String(a.rawSourceStatus ?? '—')}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 t-label">Trial portfolio</h2>
        <p className="mb-2 text-sm text-[var(--muted)]">
          {String(
            (data as { trialPortfolio?: { caveat?: string; count?: number } }).trialPortfolio
              ?.caveat ?? '',
          )}
        </p>
        <ul className="space-y-1 text-sm">
          {(
            (
              data as {
                trialPortfolio?: { items?: Array<Record<string, unknown>> };
              }
            ).trialPortfolio?.items ?? []
          ).map((t) => (
            <li key={String(t.trialId)} className="rounded border border-[var(--border)] px-2 py-1">
              <Link className="underline" to={itemPath('trial', String(t.trialId))}>
                {String(t.nctId ?? t.trialId)}
              </Link>
              {' · '}
              {String(t.overallStatus ?? 'status unknown')} · source term “{String(t.sourceTerm)}”
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 t-label">Safety</h2>
        <p className="text-sm text-[var(--muted)]">
          {String((data.safety.spontaneousReports as Record<string, unknown>).caveat)}
        </p>
        {data.safety.potentialSignals ? (
          <div className="mt-2 space-y-2 text-sm">
            <p className="text-xs text-[var(--muted)]">
              {String((data.safety.potentialSignals as Record<string, unknown>).caveat)}
            </p>
            <ul className="space-y-1">
              {(
                ((data.safety.potentialSignals as Record<string, unknown>).items as
                  Array<Record<string, unknown>> | undefined) ?? []
              ).map((s, i) => (
                <li key={i} className="rounded border border-[var(--border)] px-2 py-1">
                  {String(s.quarter)} · {String(s.productOrClass)} · {String(s.signalText)}
                  <span className="block text-xs text-[var(--tone-watch-fg)]">
                    Not proven causality · not incidence
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {data.openResolutionTasks > 0 ? (
        <p className="text-sm text-[var(--tone-watch-fg)]">
          {data.openResolutionTasks} open entity-resolution tasks.{' '}
          <Link className="underline" to="/entity-resolution">
            Open queue
          </Link>
        </p>
      ) : null}
    </div>
  );
}
