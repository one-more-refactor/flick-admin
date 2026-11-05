/**
 * End-to-end journeys for flick-admin, against the in-browser API fake in
 * ./mock-api.ts (no backend needed). Run: `bun run e2e`.
 */
import { test, expect, type Page } from '@playwright/test';
import { mockApi, ADMIN, ENV_TOKEN, STORE_KEY } from './mock-api';

async function signIn(page: Page) {
  await page.goto('/');
  await page.getByLabel('email').fill(ADMIN.email);
  await page.getByLabel('password').fill(ADMIN.password);
  await page.getByRole('button', { name: /sign in/ }).click();
  await expect(page.locator('.cp-who')).toHaveText(ADMIN.email);
}

const nav = (page: Page, label: string) => page.locator('.cp-nav').getByRole('button', { name: label, exact: true }).click();

test.describe('sign-in', () => {
  test('email + password lands on the overview dashboard', async ({ page }) => {
    await mockApi(page);
    await signIn(page);
    await expect(page.locator('.cp-h1')).toHaveText('overview');
    await expect(page.locator('.cp-stat-label', { hasText: 'users' })).toBeVisible();
    await expect(page.getByText('v1.5.0')).toBeVisible();
    await expect(page.getByText('Moby-Dick')).toBeVisible();
  });

  test('wrong password shows the server error and stays on login', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');
    await page.getByLabel('email').fill(ADMIN.email);
    await page.getByLabel('password').fill('nope');
    await page.getByRole('button', { name: /sign in/ }).click();
    await expect(page.getByRole('alert')).toHaveText('unauthorized');
    await expect(page.locator('.cp-shell')).toHaveCount(0);
  });

  test('break-glass env token works and is labelled as such', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'use an admin token instead' }).click();
    await page.getByLabel('admin token').fill(ENV_TOKEN);
    await page.getByRole('button', { name: /sign in/ }).click();
    await expect(page.locator('.cp-who')).toHaveText('env token');
  });

  test('session survives a reload; sign out revokes it server-side', async ({ page }) => {
    const api = await mockApi(page);
    await signIn(page);
    await page.reload();
    await expect(page.locator('.cp-who')).toHaveText(ADMIN.email);
    await page.getByRole('button', { name: 'sign out' }).click();
    await expect(page.getByRole('button', { name: /sign in/ })).toBeVisible();
    expect(api.log).toContain('DELETE /api/admin/session');
    expect(await page.evaluate((k) => localStorage.getItem(k), STORE_KEY)).toBeNull();
  });

  test('a tampered stored session ({}) is discarded, not trusted', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript((k) => localStorage.setItem(k, '{}'), STORE_KEY);
    await page.goto('/');
    await expect(page.getByRole('button', { name: /sign in/ })).toBeVisible();
    await expect(page.locator('.cp-shell')).toHaveCount(0);
  });

  test('an active session logs itself out when it expires', async ({ page }) => {
    await mockApi(page, { sessionTtl: 3 });
    await signIn(page);
    await expect(page.getByRole('button', { name: /sign in/ })).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('users', () => {
  test('search narrows the table and resets to page 1', async ({ page }) => {
    await mockApi(page);
    await signIn(page);
    await nav(page, 'users');
    await expect(page.locator('.cp-count')).toHaveText('65 total');
    await expect(page.locator('.cp-pager')).toBeVisible();
    await page.getByRole('button', { name: 'next →' }).click();
    await expect(page.locator('.cp-pager span')).toHaveText('51–65 of 65');
    await page.getByPlaceholder('search…').fill('hopper');
    await expect(page.locator('.cp-count')).not.toHaveText('65 total');
    await expect(page.locator('tbody tr').first()).toContainText('hopper');
    await expect(page.locator('.cp-pager')).toHaveCount(0);
  });

  test('promote to admin, then delete with the "sure?" confirmation', async ({ page }) => {
    const api = await mockApi(page);
    await signIn(page);
    await nav(page, 'users');
    await page.getByPlaceholder('search…').fill('grace.hopper1@');
    const row = page.locator('tbody tr', { hasText: 'grace.hopper1@example.test' });
    await expect(row).toHaveCount(1);

    await row.getByRole('button', { name: 'make admin' }).click();
    await expect(row.getByRole('button', { name: 'revoke admin' })).toBeVisible();
    expect(api.bodies.get(`PATCH /api/admin/users/${'u-' + (0x1a2b3c + 1 * 7919).toString(16)}`)).toEqual({ is_admin: true });

    await row.getByRole('button', { name: 'delete' }).click();
    await expect(row.getByRole('button', { name: 'sure?' })).toBeVisible();
    expect(api.log.some((l) => l.startsWith('DELETE /api/admin/users/'))).toBe(false);
    await row.getByRole('button', { name: 'sure?' }).click();
    await expect(page.getByText('nothing here')).toBeVisible();
    expect(api.log.filter((l) => l.startsWith('DELETE /api/admin/users/'))).toHaveLength(1);
  });
});

test.describe('events', () => {
  test('end an event early', async ({ page }) => {
    await mockApi(page);
    await signIn(page);
    await nav(page, 'events');
    await expect(page.locator('tbody tr')).toHaveCount(3);
    const row = page.locator('tbody tr', { hasText: 'Launch week' });
    await row.getByRole('button', { name: 'end event' }).click();
    await row.getByRole('button', { name: 'sure?' }).click();
    await expect(page.locator('tbody tr')).toHaveCount(2);
  });
});

test.describe('announcement', () => {
  test('loads the current banner and publishes an edit', async ({ page }) => {
    const api = await mockApi(page);
    await signIn(page);
    await nav(page, 'announcement');
    const message = page.getByLabel('message');
    await expect(message).toHaveValue(/flick 1\.5 is out/);
    await message.fill('Maintenance tonight 22:00–22:15 CET.');
    await page.getByLabel('link (optional)').fill('HTTPS://status.example.test/');
    await page.getByRole('button', { name: 'save' }).click();
    await expect(page.getByText('saved ✓')).toBeVisible();
    expect(api.bodies.get('PUT /api/admin/announcement')).toEqual({
      text: 'Maintenance tonight 22:00–22:15 CET.',
      link: 'https://status.example.test/',
      label: "what's new",
      active: true,
    });
  });

  for (const link of ['javascript:alert(1)', 'java\tscript:alert(1)', '//evil.example.test', '/changelog']) {
    test(`refuses link ${JSON.stringify(link)} before it reaches the API`, async ({ page }) => {
      const api = await mockApi(page);
      await signIn(page);
      await nav(page, 'announcement');
      await expect(page.getByLabel('message')).toHaveValue(/flick/);
      await page.getByLabel('link (optional)').fill(link);
      await page.getByRole('button', { name: 'save' }).click();
      await expect(page.locator('.cp-form [role="alert"]')).toContainText('link');
      expect(api.log).not.toContain('PUT /api/admin/announcement');
    });
  }

  test('fields carry the backend length caps', async ({ page }) => {
    await mockApi(page);
    await signIn(page);
    await nav(page, 'announcement');
    await expect(page.getByLabel('message')).toHaveAttribute('maxlength', '300');
    await expect(page.getByLabel('link (optional)')).toHaveAttribute('maxlength', '300');
    await expect(page.getByLabel('link label')).toHaveAttribute('maxlength', '60');
  });

  test('unpublish with the toggle', async ({ page }) => {
    const api = await mockApi(page);
    await signIn(page);
    await nav(page, 'announcement');
    const toggle = page.getByRole('switch');
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await page.getByRole('button', { name: 'save' }).click();
    await expect(page.getByText('saved ✓')).toBeVisible();
    expect((api.bodies.get('PUT /api/admin/announcement') as { active: boolean }).active).toBe(false);
  });
});
