import { describe, expect, it } from 'vitest';
import {
  fdaBulkSourceSchedules,
  nextWeeklyBrisbaneSixAm,
  scheduleForSource,
} from './source-schedule.js';

describe('FDA bulk / Purple Book source schedule', () => {
  it('computes a future weekly Brisbane Sunday 06:00', () => {
    const from = Date.parse('2026-07-22T00:00:00.000Z'); // Wednesday
    const next = nextWeeklyBrisbaneSixAm(from);
    expect(next).toBeGreaterThan(from);
    const schedules = fdaBulkSourceSchedules(from);
    expect(schedules.map((s) => s.sourceId)).toEqual(['drugs-at-fda', 'purple-book']);
    expect(scheduleForSource('drugs-at-fda', from)?.nextRunAt).toBe(new Date(next).toISOString());
  });
});
