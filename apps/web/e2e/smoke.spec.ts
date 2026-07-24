import { expect, test } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const shotDir = path.resolve(__dirname, '../../../docs/milestones/screenshots');

test.describe('Milestone 1 smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    const demo = page.getByRole('button', { name: 'Demo', exact: true });
    if (await demo.isVisible().catch(() => false)) {
      await demo.click();
      await expect(page.getByText(/Current:\s*demo/i)).toBeVisible({ timeout: 10_000 });
    }
  });
  test('Today page loads and shows differentiators', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
    await expect(page.getByText(/Demo snapshot/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Signal Radar' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'What changed since last visit' }),
    ).toBeVisible();
    await page.screenshot({ path: path.join(shotDir, 'today.png'), fullPage: true });
  });

  test('detail page exposes assessment rationale', async ({ page }) => {
    await page.goto('/interventions/int-metformin');
    await expect(page.getByRole('heading', { name: 'Metformin' })).toBeVisible();
    await expect(page.getByText(/Confidence rationale/i)).toBeVisible();
    await expect(page.getByText('Provenance', { exact: true })).toBeVisible();
    await page.screenshot({
      path: path.join(shotDir, 'intervention-metformin.png'),
      fullPage: true,
    });
  });

  test('watchlist follow persists across refresh', async ({ page }) => {
    await page.goto('/peptides/pep-bpc157');
    const follow = page.getByRole('button', { name: /Follow|Unfollow/i });
    await expect(follow).toBeVisible();
    const label = await follow.textContent();
    if (label?.includes('Follow') && !label.includes('Unfollow')) {
      await follow.click();
    }
    await page.reload();
    await expect(page.getByRole('button', { name: /Unfollow/i })).toBeVisible();
    await page.goto('/watchlists');
    await expect(page.getByText(/BPC-157/i)).toBeVisible();
    await page.screenshot({ path: path.join(shotDir, 'watchlists.png'), fullPage: true });
  });

  test('theme toggle switches document theme', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', {
      name: /Switch to light theme|Switch to dark theme/i,
    });
    await toggle.click();
    await expect.poll(async () => page.locator('html').getAttribute('data-theme')).toBe('light');
    await page.screenshot({ path: path.join(shotDir, 'theme-light.png'), fullPage: true });
  });

  test('mobile navigation drawer works', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile project only');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await expect(page.getByRole('dialog', { name: 'Navigation' })).toBeVisible();
    const methodology = page.getByRole('link', { name: 'Methodology' });
    await methodology.scrollIntoViewIfNeeded();
    await methodology.click();
    await expect(page.getByRole('heading', { name: 'Methodology' })).toBeVisible();
    await page.screenshot({ path: path.join(shotDir, 'mobile-methodology.png'), fullPage: true });
  });
});

test.describe('Milestone 3 Live intelligence surfaces', () => {
  test('claims workspace and review queue are reachable', async ({ page }) => {
    await page.goto('/claims');
    await expect(page.getByRole('heading', { name: 'Claims workspace' })).toBeVisible();
    await page.screenshot({ path: path.join(shotDir, 'm3-claims.png'), fullPage: true });

    await page.goto('/review');
    await expect(page.getByRole('heading', { name: 'Review Queue' })).toBeVisible();
    await page.screenshot({ path: path.join(shotDir, 'm3-review.png'), fullPage: true });
  });

  test('mobile review queue is reachable', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile project only');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.getByRole('link', { name: 'Review Queue' }).click();
    await expect(page.getByRole('heading', { name: 'Review Queue' })).toBeVisible();
    await page.screenshot({ path: path.join(shotDir, 'm3-mobile-review.png'), fullPage: true });
  });
});

test.describe('Milestone 4 intervention surfaces', () => {
  test('entity resolution, compare, and methodology are reachable', async ({ page }) => {
    await page.goto('/entity-resolution');
    await expect(page.getByRole('heading', { name: 'Entity Resolution Queue' })).toBeVisible();
    await page.screenshot({ path: path.join(shotDir, 'm4-entity-resolution.png'), fullPage: true });

    await page.goto('/compare');
    await expect(page.getByRole('heading', { name: 'Intervention comparison' })).toBeVisible();
    await expect(page.getByText(/No winner/i)).toBeVisible();
    await page.screenshot({ path: path.join(shotDir, 'm4-compare.png'), fullPage: true });

    await page.goto('/methodology');
    await expect(page.getByText(/Intervention identity and aliases/i)).toBeVisible();
    await page.screenshot({ path: path.join(shotDir, 'm4-methodology.png'), fullPage: true });
  });

  test('mobile compare is reachable', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile project only');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.getByRole('link', { name: 'Compare' }).click();
    await expect(page.getByRole('heading', { name: 'Intervention comparison' })).toBeVisible();
    await page.screenshot({ path: path.join(shotDir, 'm4-mobile-compare.png'), fullPage: true });
  });
});

test.describe('Milestone 5 creator surfaces', () => {
  test('creators list, claims workspace, and methodology are reachable', async ({ page }) => {
    await page.goto('/creators');
    await expect(page.getByRole('heading', { name: 'Creators' })).toBeVisible();
    await page.screenshot({ path: path.join(shotDir, 'm5-creators.png'), fullPage: true });

    await page.goto('/creator-claims');
    await expect(page.getByRole('heading', { name: 'Creator Claims' })).toBeVisible();
    await page.screenshot({ path: path.join(shotDir, 'm5-creator-claims.png'), fullPage: true });

    await page.goto('/methodology');
    await expect(page.getByText(/Creator claims, not creator worth/i)).toBeVisible();
    await page.screenshot({ path: path.join(shotDir, 'm5-methodology.png'), fullPage: true });
  });

  test('mobile creator claims is reachable', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile project only');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.getByRole('link', { name: 'Creator Claims' }).click();
    await expect(page.getByRole('heading', { name: 'Creator Claims' })).toBeVisible();
    await page.screenshot({
      path: path.join(shotDir, 'm5-mobile-creator-claims.png'),
      fullPage: true,
    });
  });
});
