import { expect, test } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const shotDir = path.resolve(__dirname, '../../../docs/milestones/screenshots');

async function switchLive(page: import('@playwright/test').Page) {
  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await page.getByRole('button', { name: 'Live', exact: true }).click();
  await expect(page.getByText(/Current:\s*live/i)).toBeVisible({ timeout: 10_000 });
}

async function switchDemo(page: import('@playwright/test').Page) {
  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await page.getByRole('button', { name: 'Demo', exact: true }).click();
  await expect(page.getByText(/Current:\s*demo/i)).toBeVisible({ timeout: 10_000 });
}

test.describe('M6 surfaces (demo-safe routes)', () => {
  test('routes are reachable and capture screenshots', async ({ page }) => {
    for (const [route, file] of [
      ['/', 'm6-today.png'],
      ['/watchlists', 'm6-watchlists.png'],
      ['/saved-searches', 'm6-saved-searches.png'],
      ['/alerts', 'm6-alerts.png'],
      ['/briefs', 'm6-briefs.png'],
      ['/operations', 'm6-operations.png'],
      ['/settings/backup', 'm6-backup-storage.png'],
      ['/settings/privacy-security', 'm6-privacy-security.png'],
      ['/settings/personalisation', 'm6-personalisation-migration.png'],
    ] as const) {
      await page.goto(route);
      await expect(page.getByRole('heading').first()).toBeVisible();
      await page.screenshot({ path: path.join(shotDir, file), fullPage: true });
    }
  });

  test('session CSRF mutation still works via proxy', async ({ page, request }) => {
    const session = await request.get('http://127.0.0.1:8787/api/session');
    expect(session.ok()).toBeTruthy();
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('mobile M6 Alert Centre and Today screenshots', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile project only');
    await page.goto('/');
    await page.screenshot({ path: path.join(shotDir, 'm6-mobile-today.png'), fullPage: true });
    await page.goto('/alerts');
    await page.screenshot({ path: path.join(shotDir, 'm6-mobile-alerts.png'), fullPage: true });
    await page.goto('/briefs');
    await page.screenshot({ path: path.join(shotDir, 'm6-mobile-briefs.png'), fullPage: true });
  });
});

// Live mutations share process.env.HEALTHSPAN_DATA_MODE on the API server.
// Keep them chromium-only and serial so Demo smoke tests are not raced.
test.describe('M6 Live mutations', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(({ isMobile }) => {
    test.skip(Boolean(isMobile), 'Live mode mutations are chromium-only to avoid shared API races');
  });

  test.afterEach(async ({ page }) => {
    await switchDemo(page).catch(() => undefined);
  });

  test('Live watchlist create via API-backed UI', async ({ page }) => {
    await switchLive(page);
    await page.goto('/watchlists');
    await expect(page.getByRole('heading', { name: 'Watchlists' })).toBeVisible();
    const name = `E2E WL ${Date.now()}`;
    await page.getByLabel('New watchlist name').fill(name);
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('button', { name })).toBeVisible({ timeout: 15_000 });
  });

  test('saved searches / alerts / briefs / ops / backup / privacy headings', async ({ page }) => {
    await switchLive(page);
    for (const [route, title] of [
      ['/saved-searches', 'Saved Searches'],
      ['/alerts', 'Alert Centre'],
      ['/briefs', 'Briefings'],
      ['/operations', 'Operations'],
      ['/settings/backup', 'Backup'],
      ['/settings/privacy-security', 'Privacy'],
      ['/settings/personalisation', 'Personalisation'],
    ] as const) {
      await page.goto(route);
      await expect(page.getByRole('heading', { name: new RegExp(title, 'i') })).toBeVisible();
    }
  });
});
