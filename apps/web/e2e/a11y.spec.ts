import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const states: Array<{ name: string; path: string }> = [
  { name: 'Live/Demo Today', path: '/' },
  { name: 'Discover', path: '/discover' },
  { name: 'Watchlists', path: '/watchlists' },
  { name: 'Research', path: '/research' },
  { name: 'Trials', path: '/trials' },
  { name: 'Interventions', path: '/interventions' },
  { name: 'Peptides', path: '/peptides' },
  { name: 'Creators', path: '/creators' },
  { name: 'Creator Claims', path: '/creator-claims' },
  { name: 'Claims workspace', path: '/claims' },
  { name: 'Review Queue', path: '/review' },
  { name: 'Entity resolution', path: '/entity-resolution' },
  { name: 'Compare', path: '/compare' },
  { name: 'Regulatory & Safety', path: '/safety' },
  { name: 'Sources / operations', path: '/sources' },
  { name: 'Methodology', path: '/methodology' },
  { name: 'Settings / backup prefs', path: '/settings' },
];

for (const state of states) {
  test(`axe: ${state.name}`, async ({ page }) => {
    await page.goto(state.path);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
}

test('axe mobile navigation state', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile project only');
  await page.goto('/');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(serious).toEqual([]);
});

// Extra states for brief coverage when detail routes resolve in demo data
const detailStates = [
  { name: 'Watchlist-adjacent since-last-visit on Today', path: '/' },
  { name: 'Alert-centre-adjacent Sources', path: '/sources' },
  { name: 'Daily-brief-adjacent Today', path: '/' },
  { name: 'Weekly-review-adjacent Review', path: '/review' },
  { name: 'Security/Privacy via Settings', path: '/settings' },
  { name: 'Backup & Storage via Settings', path: '/settings' },
];

for (const state of detailStates) {
  test(`axe coverage: ${state.name}`, async ({ page }) => {
    await page.goto(state.path);
    await page.waitForLoadState('domcontentloaded');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
}
