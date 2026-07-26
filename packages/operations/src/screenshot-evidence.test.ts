import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const shotDir = path.resolve(here, '../../../docs/milestones/screenshots');

/** Playwright's mobile project viewport width. */
const MOBILE_WIDTH = 375;

/**
 * Desktop-named files that are still 375px because their capture never runs on the
 * desktop project.
 *
 * - `m6-alert-detail`, `m6-brief-source-coverage`, `m6-weekly-review` are cited in
 *   `M6_COMPLETION_REPORT.md` but have **no generator in the E2E suite at all**, so
 *   they cannot be refreshed. Their current contents are a mislabelled capture of
 *   Today left by the pre-fix runs.
 * - `m6-prune-preview`, `m6-retention-preview` are captured inside `if (visible)`
 *   branches that do not fire in the seeded test environment.
 *
 * This list must only ever shrink. Removing an entry requires either giving the file
 * a generator that runs on the desktop project, or removing the citation.
 */
const KNOWN_STALE = new Set([
  'm6-alert-detail.png',
  'm6-brief-source-coverage.png',
  'm6-prune-preview.png',
  'm6-retention-preview.png',
  'm6-weekly-review.png',
]);

function pngSize(file: string): { width: number; height: number } {
  // IHDR: width at byte offset 16, height at 20, both big-endian uint32.
  const fd = fs.openSync(file, 'r');
  try {
    const buf = Buffer.alloc(24);
    fs.readSync(fd, buf, 0, 24, 0);
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  } finally {
    fs.closeSync(fd);
  }
}

const shots = fs.existsSync(shotDir)
  ? fs.readdirSync(shotDir).filter((f) => f.endsWith('.png'))
  : [];

describe('milestone screenshot evidence', () => {
  it('has screenshots committed', () => {
    expect(shots.length).toBeGreaterThan(0);
  });

  /**
   * Both Playwright projects execute the same specs. They previously wrote identical
   * output paths, so the mobile project silently replaced every desktop capture and
   * no desktop-width evidence survived. Desktop-named files must come from the
   * desktop project.
   */
  it('captures desktop-named evidence at desktop width', () => {
    const offenders = shots
      .filter((f) => !f.includes('mobile') && !KNOWN_STALE.has(f))
      .filter((f) => pngSize(path.join(shotDir, f)).width <= MOBILE_WIDTH)
      .sort();
    expect(offenders).toEqual([]);
  });

  /**
   * A mobile/desktop pair that is byte-identical means one overwrote the other, so
   * the pair documents a single viewport while claiming to document two.
   */
  it('keeps each mobile capture distinct from its desktop counterpart', () => {
    const collisions: string[] = [];
    for (const mobileName of shots.filter((f) => f.includes('mobile'))) {
      const desktopName = mobileName.replace('mobile-', '').replace('-mobile', '');
      if (desktopName === mobileName || !shots.includes(desktopName)) continue;
      const a = fs.readFileSync(path.join(shotDir, mobileName));
      const b = fs.readFileSync(path.join(shotDir, desktopName));
      if (a.equals(b)) collisions.push(`${mobileName} == ${desktopName}`);
    }
    expect(collisions).toEqual([]);
  });

  it('only lists genuinely stale files as known-stale', () => {
    // Guards the allowlist itself: an entry that no longer exists, or that is no
    // longer stale, must be removed rather than left to rot.
    for (const name of KNOWN_STALE) {
      expect(shots, `${name} is allowlisted but absent`).toContain(name);
      expect(
        pngSize(path.join(shotDir, name)).width,
        `${name} is no longer stale — remove it from KNOWN_STALE`,
      ).toBeLessThanOrEqual(MOBILE_WIDTH);
    }
  });
});
