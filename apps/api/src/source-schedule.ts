/** Per-source due times for FDA bulk / Purple Book hardening (M5 §5.1). */

const BRISBANE_OFFSET_MS = 10 * 60 * 60 * 1000;

/** Next Sunday 06:00 Australia/Brisbane as UTC ms. */
export function nextWeeklyBrisbaneSixAm(fromMs = Date.now()): number {
  const local = new Date(fromMs + BRISBANE_OFFSET_MS);
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const d = local.getUTCDate();
  const dow = local.getUTCDay(); // 0 = Sunday
  const daysUntilSunday = (7 - dow) % 7;
  let candidate = Date.UTC(y, m, d + daysUntilSunday, 6, 0, 0) - BRISBANE_OFFSET_MS;
  if (candidate <= fromMs) {
    candidate += 7 * 24 * 60 * 60 * 1000;
  }
  return candidate;
}

export type SourceScheduleInfo = {
  sourceId: string;
  cadence: string;
  nextRunAt: string;
  notes: string;
};

export function fdaBulkSourceSchedules(fromMs = Date.now()): SourceScheduleInfo[] {
  const next = nextWeeklyBrisbaneSixAm(fromMs);
  const iso = new Date(next).toISOString();
  return [
    {
      sourceId: 'drugs-at-fda',
      cadence: 'weekly_sunday_0600_brisbane',
      nextRunAt: iso,
      notes:
        'Official Drugs@FDA ZIP projection path; scheduled due time for operators. Unchanged ZIP fingerprints stay idempotent.',
    },
    {
      sourceId: 'purple-book',
      cadence: 'weekly_sunday_0600_brisbane',
      nextRunAt: iso,
      notes: 'Weekly Purple Book CSV refresh due wiring. No interchangeability or peptide inference.',
    },
  ];
}

export function scheduleForSource(sourceId: string, fromMs = Date.now()): SourceScheduleInfo | null {
  return fdaBulkSourceSchedules(fromMs).find((s) => s.sourceId === sourceId) ?? null;
}
