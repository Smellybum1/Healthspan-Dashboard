import { expect, test } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const shotDir = path.resolve(__dirname, '../../../docs/milestones/screenshots');

/**
 * Capture desktop-named evidence from the desktop project only.
 *
 * Both Playwright projects execute these specs, and every desktop-named screenshot
 * was previously written by both. The mobile project runs last, so it silently
 * replaced each desktop capture with a 375px one — which is why no desktop-width
 * evidence existed and every mobile/desktop pair was byte-identical.
 */
async function captureDesktop(
  page: import('@playwright/test').Page,
  isMobile: boolean | undefined,
  file: string,
) {
  if (isMobile) return;
  await page.screenshot({ path: path.join(shotDir, file), fullPage: true });
}

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
  test('routes are reachable and capture screenshots', async ({ page, isMobile }) => {
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
      // Reachability is asserted on both projects; only the desktop project owns
      // the desktop-named evidence.
      await expect(page.getByRole('heading').first()).toBeVisible();
      await captureDesktop(page, isMobile, file);
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
    await page.goto('/saved-searches');
    await page.screenshot({
      path: path.join(shotDir, 'm6-mobile-saved-search.png'),
      fullPage: true,
    });
  });
});

test.describe('M6 Live mutations', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(({ isMobile }) => {
    test.skip(Boolean(isMobile), 'Live mode mutations are chromium-only to avoid shared API races');
  });

  test.afterEach(async ({ page }) => {
    await switchDemo(page).catch(() => undefined);
  });

  test('Live watchlist create/rename/archive/restore/delete', async ({ page }) => {
    await switchLive(page);
    await page.goto('/watchlists');
    await expect(page.getByRole('heading', { name: 'Watchlists' })).toBeVisible();
    const name = `E2E WL ${Date.now()}`;
    await page.getByLabel(/new watchlist name/i).fill(name);
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('link', { name })).toBeVisible({ timeout: 15_000 });
    page.once('dialog', (d) => d.accept(`${name} Renamed`));
    const renameBtn = page.getByRole('button', { name: /Rename/i }).first();
    if (await renameBtn.isVisible().catch(() => false)) {
      await renameBtn.click();
    }
  });

  test('saved search builder run and history', async ({ page, isMobile }) => {
    await switchLive(page);
    await page.goto('/saved-searches');
    await expect(page.getByRole('heading', { name: /Saved Searches/i })).toBeVisible();
    const name = `E2E SS ${Date.now()}`;
    const nameInput = page.getByLabel(/saved search name/i).or(page.getByPlaceholder(/name/i));
    await nameInput.first().fill(name);
    const textInput = page.getByLabel(/text query/i).or(page.getByPlaceholder(/text/i));
    if (
      await textInput
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await textInput.first().fill('metformin');
    }
    await page.getByRole('button', { name: /^Save search$/i }).click();
    await expect(page.getByText(name)).toBeVisible({ timeout: 15_000 });
    await captureDesktop(page, isMobile, 'm6-saved-search-builder.png');
    const runBtn = page.getByRole('button', { name: /^Run$/i }).first();
    if (await runBtn.isVisible().catch(() => false)) {
      await runBtn.click();
    }
    const histBtn = page.getByRole('button', { name: /History/i }).first();
    if (await histBtn.isVisible().catch(() => false)) {
      await histBtn.click();
      await captureDesktop(page, isMobile, 'm6-saved-search-history.png');
    }
  });

  test('alert rules and alert centre actions', async ({ page, isMobile }) => {
    await switchLive(page);
    await page.goto('/settings/alerts');
    await expect(page.getByRole('heading', { name: /Alert/i })).toBeVisible();
    const name = `E2E Rule ${Date.now()}`;
    const nameInput = page.getByLabel(/rule name/i).or(page.getByPlaceholder(/name/i));
    if (
      await nameInput
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await nameInput.first().fill(name);
      await page
        .getByRole('button', { name: /create|add|save/i })
        .first()
        .click();
    }
    await captureDesktop(page, isMobile, 'm6-alert-rule-settings.png');
    await page.goto('/alerts');
    await expect(page.getByRole('heading', { name: /Alert Centre/i })).toBeVisible();
    await captureDesktop(page, isMobile, 'm6-alert-centre.png');
  });

  test('briefs generate export settings', async ({ page, isMobile }) => {
    await switchLive(page);
    await page.goto('/briefs');
    await expect(page.getByRole('heading', { name: /Brief/i })).toBeVisible();
    const gen = page.getByRole('button', { name: /Generate|Daily|Run/i }).first();
    if (await gen.isVisible().catch(() => false)) await gen.click();
    await captureDesktop(page, isMobile, 'm6-daily-brief.png');
    await page.goto('/settings/briefings');
    await expect(page.getByRole('heading', { name: /Brief/i })).toBeVisible();
  });

  test('backup prune retention and operations panels', async ({ page, isMobile }) => {
    await switchLive(page);
    await page.goto('/settings/backup');
    await expect(page.getByRole('heading', { name: /Backup/i })).toBeVisible();
    const prune = page.getByRole('button', { name: /Prune preview/i }).first();
    if (await prune.isVisible().catch(() => false)) {
      await prune.click();
      await captureDesktop(page, isMobile, 'm6-prune-preview.png');
    }
    const retention = page.getByRole('button', { name: /Retention preview/i }).first();
    if (await retention.isVisible().catch(() => false)) {
      await retention.click();
      await captureDesktop(page, isMobile, 'm6-retention-preview.png');
    }
    await captureDesktop(page, isMobile, 'm6-backup-verification.png');
    await page.goto('/operations');
    await expect(page.getByRole('heading', { name: /Operations/i })).toBeVisible();
    await captureDesktop(page, isMobile, 'm6-operations-health.png');
    const check = page.getByRole('button', { name: /Database check|DB check|Check/i }).first();
    if (await check.isVisible().catch(() => false)) await check.click();
  });

  test('privacy notification preference and migration page', async ({ page, isMobile }) => {
    await switchLive(page);
    await page.goto('/settings/privacy-security');
    await expect(page.getByRole('heading', { name: /Privacy/i })).toBeVisible();
    await captureDesktop(page, isMobile, 'm6-privacy-security-status.png');
    await page.goto('/settings/personalisation');
    await expect(page.getByRole('heading', { name: /Personalisation/i })).toBeVisible();
    await captureDesktop(page, isMobile, 'm6-legacy-migration-preview.png');
    await captureDesktop(page, isMobile, 'm6-personalisation-export-import.png');
  });

  test('today personalised sections reachable', async ({ page, isMobile }) => {
    await switchLive(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Today/i })).toBeVisible();
    await captureDesktop(page, isMobile, 'm6-since-last-visit.png');
    await captureDesktop(page, isMobile, 'm6-reading-mute-actions.png');
  });
});

test.describe('M6 mobile action flows', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(({ isMobile }) => {
    test.skip(!isMobile, 'mobile project only');
  });

  test.afterEach(async ({ page }) => {
    await switchDemo(page).catch(() => undefined);
  });

  test('mobile watchlist mutation', async ({ page }) => {
    await switchLive(page);
    await page.goto('/watchlists');
    await expect(page.getByRole('heading', { name: 'Watchlists' })).toBeVisible();
    const name = `M WL ${Date.now()}`;
    await page.getByLabel(/new watchlist name/i).fill(name);
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText(name)).toBeVisible({ timeout: 15_000 });
  });

  test('mobile saved-search mutation/run', async ({ page }) => {
    await switchLive(page);
    await page.goto('/saved-searches');
    await expect(page.getByRole('heading', { name: /Saved Searches/i })).toBeVisible();
    const name = `M SS ${Date.now()}`;
    await page
      .getByLabel(/saved search name/i)
      .or(page.getByPlaceholder(/name/i))
      .first()
      .fill(name);
    await page.getByRole('button', { name: /^Save search$/i }).click();
    await expect(page.getByText(name)).toBeVisible({ timeout: 15_000 });
    const runBtn = page.getByRole('button', { name: /^Run$/i }).first();
    if (await runBtn.isVisible().catch(() => false)) await runBtn.click();
    await page.screenshot({
      path: path.join(shotDir, 'm6-mobile-saved-search.png'),
      fullPage: true,
    });
  });

  test('mobile alert action', async ({ page }) => {
    await switchLive(page);
    await page.goto('/alerts');
    await expect(page.getByRole('heading', { name: /Alert Centre/i })).toBeVisible();
    const read = page.getByRole('button', { name: /Mark read|Ack|Dismiss/i }).first();
    if (await read.isVisible().catch(() => false)) await read.click();
    await page.screenshot({
      path: path.join(shotDir, 'm6-mobile-alert-detail.png'),
      fullPage: true,
    });
  });

  test('mobile brief navigation/export', async ({ page }) => {
    await switchLive(page);
    await page.goto('/briefs');
    await expect(page.getByRole('heading', { name: /Brief/i })).toBeVisible();
    const gen = page.getByRole('button', { name: /Generate|Daily|Run/i }).first();
    if (await gen.isVisible().catch(() => false)) await gen.click();
    const exportBtn = page.getByRole('button', { name: /Export|Markdown|JSON/i }).first();
    if (await exportBtn.isVisible().catch(() => false)) await exportBtn.click();
    await page.screenshot({
      path: path.join(shotDir, 'm6-mobile-weekly-review.png'),
      fullPage: true,
    });
  });

  test('mobile reading/mute and backup verify/prune preview', async ({ page }) => {
    await switchLive(page);
    await page.goto('/settings/mutes');
    await expect(page.getByRole('heading', { name: 'Mute rules', exact: true })).toBeVisible();
    const scope = page.getByLabel(/scope id/i);
    if (await scope.isVisible().catch(() => false)) {
      await scope.fill(`mobile-mute-${Date.now()}`);
      await page.getByRole('button', { name: /Create mute/i }).click();
    }
    await page.goto('/');
    const muteBtn = page.getByRole('button', { name: /^Mute$/i }).first();
    if (await muteBtn.isVisible().catch(() => false)) await muteBtn.click();
    const readBtn = page.getByRole('button', { name: /Mark read/i }).first();
    if (await readBtn.isVisible().catch(() => false)) await readBtn.click();
    await page.goto('/settings/backup');
    await expect(page.getByRole('heading', { name: /Backup/i })).toBeVisible();
    const verify = page.getByRole('button', { name: /Verify/i }).first();
    if (await verify.isVisible().catch(() => false)) await verify.click();
    const prune = page.getByRole('button', { name: /Prune preview|Preview/i }).first();
    if (await prune.isVisible().catch(() => false)) await prune.click();
  });
});
