import { expect, test } from '@playwright/test';

test.describe('request-integrity bootstrap', () => {
  test('session bootstrap + CSRF-bearing mutation via proxy', async ({ page, request }) => {
    const session = await request.get('http://127.0.0.1:5173/api/session');
    expect(session.ok()).toBeTruthy();
    const body = (await session.json()) as { csrfToken: string };
    expect(body.csrfToken.length).toBeGreaterThan(10);

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();

    // Mode switch uses postJson → session + CSRF
    const toggle = page.getByRole('button', { name: /Live|Demo/i }).first();
    if (await toggle.isVisible().catch(() => false)) {
      await toggle.click();
    }
  });

  test('API rejects Origin null mutation', async ({ request }) => {
    const session = await request.get('http://127.0.0.1:8787/api/session', {
      headers: { host: '127.0.0.1:8787' },
    });
    const body = (await session.json()) as { csrfToken: string };
    const cookie = session.headers()['set-cookie'] ?? '';
    const res = await request.post('http://127.0.0.1:8787/api/mode', {
      headers: {
        host: '127.0.0.1:8787',
        origin: 'null',
        cookie,
        'x-csrf-token': body.csrfToken,
        'content-type': 'application/json',
      },
      data: { dataMode: 'live' },
    });
    expect(res.status()).toBe(403);
  });
});
