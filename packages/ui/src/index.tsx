import type { ReactNode } from 'react';
import clsx from 'clsx';
import {
  EVIDENCE_MATURITY_LABELS,
  REGULATORY_STATUS_LABELS,
  SAFETY_SEVERITY_LABELS,
  TRANSLATION_GAP_LABELS,
  confidenceBand,
  evidenceTone,
  type EvidenceMaturity,
  type RegulatoryStatus,
  type SafetySeverity,
  type TranslationGapType,
} from '@healthspan/core';

export function cn(...parts: Array<string | false | null | undefined>) {
  return clsx(parts);
}

export function EvidenceMaturityBadge({ maturity }: { maturity: EvidenceMaturity }) {
  const tone = evidenceTone(maturity);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        tone === 'established' && 'bg-teal-500/15 text-teal-200 ring-teal-500/30',
        tone === 'emerging' && 'bg-amber-500/15 text-amber-100 ring-amber-500/30',
        tone === 'weak' && 'bg-slate-500/20 text-slate-200 ring-slate-400/30',
      )}
      title={EVIDENCE_MATURITY_LABELS[maturity]}
    >
      <span aria-hidden="true">●</span>
      {EVIDENCE_MATURITY_LABELS[maturity]}
    </span>
  );
}

export function ConfidenceBadge({ score }: { score: number }) {
  const band = confidenceBand(score);
  return (
    <span
      className={cn(
        'inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        band === 'high' && 'bg-teal-500/15 text-teal-200 ring-teal-500/30',
        band === 'moderate' && 'bg-amber-500/15 text-amber-100 ring-amber-500/30',
        band === 'low' && 'bg-rose-500/10 text-rose-200 ring-rose-400/30',
      )}
    >
      Confidence: {band} ({Math.round(score * 100)}%)
    </span>
  );
}

export function RegulatoryBadge({ status }: { status: RegulatoryStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        status === 'approved' && 'bg-teal-500/15 text-teal-200 ring-teal-500/30',
        status === 'off_label' && 'bg-sky-500/15 text-sky-100 ring-sky-500/30',
        status === 'investigational' && 'bg-amber-500/15 text-amber-100 ring-amber-500/30',
        (status === 'unapproved' || status === 'prohibited') &&
          'bg-rose-500/15 text-rose-100 ring-rose-500/40',
        status === 'unknown' && 'bg-slate-500/20 text-slate-200 ring-slate-400/30',
      )}
    >
      {REGULATORY_STATUS_LABELS[status]}
    </span>
  );
}

export function SafetyBadge({ severity }: { severity: SafetySeverity }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        severity === 'info' && 'bg-slate-500/20 text-slate-200 ring-slate-400/30',
        severity === 'low' && 'bg-sky-500/15 text-sky-100 ring-sky-500/30',
        severity === 'moderate' && 'bg-amber-500/15 text-amber-100 ring-amber-500/30',
        (severity === 'high' || severity === 'critical') &&
          'bg-rose-500/15 text-rose-100 ring-rose-500/40',
      )}
    >
      Safety: {SAFETY_SEVERITY_LABELS[severity]}
    </span>
  );
}

export function TranslationGapChips({ gaps }: { gaps: TranslationGapType[] }) {
  if (gaps.length === 0) {
    return <span className="text-xs text-[var(--muted)]">No translation gaps flagged</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {gaps.map((gap) => (
        <span
          key={gap}
          className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs text-amber-100 ring-1 ring-amber-500/25"
        >
          {TRANSLATION_GAP_LABELS[gap]}
        </span>
      ))}
    </div>
  );
}

export function DemoBanner({ notice }: { notice: string }) {
  return (
    <div
      role="status"
      className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-50"
    >
      {notice}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-[var(--fg)]">{title}</h2>
          {description ? <p className="mt-1 text-sm text-[var(--muted)]">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--border)] px-4 py-8 text-center">
      <p className="font-medium text-[var(--fg)]">{title}</p>
      <p className="mt-1 text-sm text-[var(--muted)]">{body}</p>
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-[var(--surface-2)]', className)} />;
}
