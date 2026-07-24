import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ConfidenceBadge,
  EvidenceMaturityBadge,
  RegulatoryBadge,
  SafetyBadge,
  TranslationGapChips,
} from '@healthspan/ui';
import type { EvidenceAssessment } from '@healthspan/core';
import { usePreferences } from '../state/PreferencesContext';
import { fetchMode } from '../lib/api';
import { m6Api } from '../lib/m6Api';
import { useAsync } from '../hooks/useAsync';

export function AssessmentPanel({ assessment }: { assessment: EvidenceAssessment }) {
  return (
    <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <h3 className="text-sm font-semibold">Evidence assessment</h3>
      <div className="flex flex-wrap gap-2">
        <EvidenceMaturityBadge maturity={assessment.maturity} />
        <ConfidenceBadge score={assessment.confidenceScore} />
      </div>
      <div>
        <p className="text-xs font-medium text-[var(--muted)]">Confidence rationale</p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
          {assessment.confidenceRationale.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-1 text-xs font-medium text-[var(--muted)]">Translation gaps</p>
        <TranslationGapChips gaps={assessment.translationGaps} />
      </div>
      <div>
        <p className="text-xs font-medium text-[var(--muted)]">Attention</p>
        <p className="text-sm">{Math.round(assessment.attentionScore * 100)}%</p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
          {assessment.attentionRationale.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
      {assessment.safetyNotes.length ? (
        <div>
          <p className="text-xs font-medium text-[var(--muted)]">Safety notes</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
            {assessment.safetyNotes.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {assessment.regulatoryStatuses.length ? (
        <div className="flex flex-wrap gap-2">
          {assessment.regulatoryStatuses.map((reg) => (
            <span
              key={`${reg.jurisdiction}-${reg.status}-${reg.indication ?? ''}`}
              className="inline-flex items-center gap-1"
            >
              <span className="text-xs text-[var(--muted)]">{reg.jurisdiction}</span>
              <RegulatoryBadge status={reg.status} />
              {reg.indication ? (
                <span className="text-xs text-[var(--muted)]">({reg.indication})</span>
              ) : null}
            </span>
          ))}
        </div>
      ) : null}
      <div>
        <p className="text-xs font-medium text-[var(--muted)]">What would change our assessment?</p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
          {assessment.whatWouldChangeAssessment.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
      <div className="rounded-lg bg-[var(--surface-2)] p-3 text-xs text-[var(--muted)]">
        <p className="font-medium text-[var(--fg)]">Provenance</p>
        <p>Sources: {assessment.provenance.sourceIds.join(', ')}</p>
        <p>Source records: {assessment.provenance.sourceRecordIds.join(', ')}</p>
        {assessment.provenance.notes ? <p>{assessment.provenance.notes}</p> : null}
      </div>
    </div>
  );
}

export function FollowButton({
  id,
  label,
  targetType = 'content_item',
}: {
  id: string;
  label?: string;
  targetType?: string;
}) {
  const { isFollowed, toggleFollowId } = usePreferences();
  const modeState = useAsync(() => fetchMode(), []);
  const mode = modeState.data?.dataMode ?? 'live';
  const [liveFollowing, setLiveFollowing] = useState<boolean | null>(null);

  useEffect(() => {
    if (mode !== 'live') return;
    void m6Api
      .followStatus(targetType, id)
      .then((r) => setLiveFollowing(r.following))
      .catch(() => setLiveFollowing(false));
  }, [mode, targetType, id]);

  const followed = mode === 'live' ? Boolean(liveFollowing) : isFollowed(id);

  return (
    <button
      type="button"
      onClick={() => {
        if (mode === 'live') {
          void m6Api
            .follow({
              targetType,
              targetId: id,
              displayTitle: label ?? id,
              unfollow: followed,
            })
            .then((r) => setLiveFollowing(Boolean((r as { following?: boolean }).following)))
            .catch(() => undefined);
          return;
        }
        toggleFollowId(id);
      }}
      className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
      aria-pressed={followed}
    >
      {followed ? `Unfollow${label ? ` ${label}` : ''}` : `Follow${label ? ` ${label}` : ''}`}
    </button>
  );
}

export function ItemList({
  items,
  hrefFor,
}: {
  items: Array<{ id: string; title: string; summary: string; type: string }>;
  hrefFor: (item: { id: string; type: string }) => string;
}) {
  if (!items.length) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
        No results match the current filters.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      {items.map((item) => (
        <li key={item.id}>
          <Link to={hrefFor(item)} className="block px-4 py-3 hover:bg-[var(--surface-2)]">
            <div className="flex items-center gap-2">
              <span className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--muted)]">
                {item.type.replaceAll('_', ' ')}
              </span>
              <p className="font-medium">{item.title}</p>
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{item.summary}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm text-[var(--muted)]">{description}</p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}

export { SafetyBadge };
