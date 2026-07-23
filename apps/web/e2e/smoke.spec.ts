import { expect, test } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const shotDir = path.resolve(__dirname, '../../../docs/milestones/screenshots');

test.describe('Milestone 1 smoke', () => {
  test('Today page loads and shows differentiators', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
    await expect(page.getByText(/Demo snapshot/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Signal Radar' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'What changed since last visit' })).toBeVisible();
    await page.screenshot({ path: path.join(shotDir, 'today.png'), fullPage: true });
  });

  test('detail page exposes assessment rationale', async ({ page }) => {
    await page.goto('/interventions/int-metformin');
    await expect(page.getByRole('heading', { name: 'Metformin' })).toBeVisible();
    await expect(page.getByText(/Confidence rationale/i)).toBeVisible();
    await expect(page.getByText('Provenance', { exact: true })).toBeVisible();
    await page.screenshot({ path: path.join(shotDir, 'intervention-metformin.png'), fullPage: true });
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
    const toggle = page.getByRole('button', { name: /Switch to light theme|Switch to dark theme/i });
    await toggle.click();
    await expect
      .poll(async () => page.locator('html').getAttribute('data-theme'))
      .toBe('light');
    await page.screenshot({ path: path.join(shotDir, 'theme-light.png'), fullPage: true });
  });

  test('mobile navigation drawer works', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile project only');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await expect(page.getByRole('dialog', { name: 'Navigation' })).toBeVisible();
    await page.getByRole('link', { name: 'Methodology' }).click();
    await expect(page.getByRole('heading', { name: 'Methodology' })).toBeVisible();
    await page.screenshot({ path: path.join(shotDir, 'mobile-methodology.png'), fullPage: true });
  });
});
