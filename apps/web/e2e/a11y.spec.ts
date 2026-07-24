import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const states: Array<{ name: string; path: string }> = [
  { name: 'Personalised Today', path: '/' },
  { name: 'Watchlists CRUD', path: '/watchlists' },
  { name: 'Saved Searches', path: '/saved-searches' },
  { name: 'Alert Centre', path: '/alerts' },
  { name: 'Briefings', path: '/briefs' },
  { name: 'Operations', path: '/operations' },
  { name: 'Settings hub', path: '/settings' },
  { name: 'Personalisation migration', path: '/settings/personalisation' },
  { name: 'Briefing settings', path: '/settings/briefings' },
  { name: 'Alert settings', path: '/settings/alerts' },
  { name: 'Backup & Storage', path: '/settings/backup' },
  { name: 'Privacy & Security', path: '/settings/privacy-security' },
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
  { name: 'Sources', path: '/sources' },
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
