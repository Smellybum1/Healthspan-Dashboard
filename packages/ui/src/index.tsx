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

/**
 * Semantic status tones. Each maps to theme-aware tokens rather than a raw Tailwind
 * palette step, so the same badge stays legible in both themes.
 *
 * Class strings are written out literally because Tailwind only emits classes it can
 * see in source — a template-built class name would silently produce no CSS.
 */
export type StatusTone = 'ok' | 'watch' | 'flag' | 'info' | 'neutral';

const TONE_CLASS: Record<StatusTone, string> = {
  ok: 'bg-[var(--tone-ok-bg)] text-[var(--tone-ok-fg)] ring-[var(--tone-ok-ring)]',
  watch: 'bg-[var(--tone-watch-bg)] text-[var(--tone-watch-fg)] ring-[var(--tone-watch-ring)]',
  flag: 'bg-[var(--tone-flag-bg)] text-[var(--tone-flag-fg)] ring-[var(--tone-flag-ring)]',
  info: 'bg-[var(--tone-info-bg)] text-[var(--tone-info-fg)] ring-[var(--tone-info-ring)]',
  neutral:
    'bg-[var(--tone-neutral-bg)] text-[var(--tone-neutral-fg)] ring-[var(--tone-neutral-ring)]',
};

/**
 * A tone-distinct glyph so severity survives greyscale, print, and colour-vision
 * deficiency. Previously every tone shared "●", which carried no signal at all.
 */
const TONE_GLYPH: Record<StatusTone, string> = {
  ok: '●',
  watch: '▲',
  flag: '◆',
  info: '■',
  neutral: '○',
};

const BADGE_BASE =
  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset';

export function StatusBadge({
  tone,
  children,
  title,
}: {
  tone: StatusTone;
  children: ReactNode;
  title?: string;
}) {
  return (
    <span className={cn(BADGE_BASE, TONE_CLASS[tone])} title={title}>
      <span aria-hidden="true">{TONE_GLYPH[tone]}</span>
      {children}
    </span>
  );
}

export function EvidenceMaturityBadge({ maturity }: { maturity: EvidenceMaturity }) {
  const tone = evidenceTone(maturity);
  const statusTone: StatusTone =
    tone === 'established' ? 'ok' : tone === 'emerging' ? 'watch' : 'neutral';
  return (
    <StatusBadge tone={statusTone} title={EVIDENCE_MATURITY_LABELS[maturity]}>
      {EVIDENCE_MATURITY_LABELS[maturity]}
    </StatusBadge>
  );
}

export function ConfidenceBadge({ score }: { score: number }) {
  const band = confidenceBand(score);
  const tone: StatusTone = band === 'high' ? 'ok' : band === 'moderate' ? 'watch' : 'flag';
  return (
    <StatusBadge tone={tone}>
      Confidence: {band} ({Math.round(score * 100)}%)
    </StatusBadge>
  );
}

export function RegulatoryBadge({ status }: { status: RegulatoryStatus }) {
  const tone: StatusTone =
    status === 'approved'
      ? 'ok'
      : status === 'off_label'
        ? 'info'
        : status === 'investigational'
          ? 'watch'
          : status === 'unapproved' || status === 'prohibited'
            ? 'flag'
            : 'neutral';
  return <StatusBadge tone={tone}>{REGULATORY_STATUS_LABELS[status]}</StatusBadge>;
}

export function SafetyBadge({ severity }: { severity: SafetySeverity }) {
  const tone: StatusTone =
    severity === 'info'
      ? 'neutral'
      : severity === 'low'
        ? 'info'
        : severity === 'moderate'
          ? 'watch'
          : 'flag';
  return <StatusBadge tone={tone}>Safety: {SAFETY_SEVERITY_LABELS[severity]}</StatusBadge>;
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
          className="rounded-md bg-[var(--tone-watch-bg)] px-2 py-0.5 text-xs text-[var(--tone-watch-fg)] ring-1 ring-[var(--tone-watch-ring)]"
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
      className="rounded-lg border border-[var(--tone-watch-ring)] bg-[var(--tone-watch-bg)] px-3 py-2 text-sm text-[var(--tone-watch-fg)]"
    >
      {notice}
    </div>
  );
}

/**
 * Rank a section carries on the page.
 *
 * `primary` answers the page's question, `utility` is diagnostics you scan rather
 * than read. Without this axis every section rendered at identical weight, so a
 * page of thirteen cards gave the reader no order to work in.
 */
export type SectionEmphasis = 'primary' | 'default' | 'utility';

export function SectionCard({
  title,
  description,
  action,
  emphasis = 'default',
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  emphasis?: SectionEmphasis;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        'card',
        emphasis === 'primary' && 'border-l-2 border-l-[var(--tone-ok)]',
        emphasis === 'utility' && 'bg-transparent',
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2
            className={cn(
              emphasis === 'primary' && 'display t-page-sub text-[var(--fg)]',
              emphasis === 'default' && 't-section text-[var(--fg)]',
              emphasis === 'utility' && 't-label',
            )}
          >
            {title}
          </h2>
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
