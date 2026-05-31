import { expect, test } from '@playwright/test';

test.describe('deployed read-only checks', () => {
  test('dashboard renders without server errors', async ({ page, request }) => {
    const health = await request.get('/api/health');
    expect(health.ok()).toBeTruthy();

    const profile = await request.get('/api/profile');
    expect([200, 404]).toContain(profile.status());

    await page.goto('/');

    await expect(page.getByText(/Daily Dashboard|Complete Your Profile|Profile not found/i)).toBeVisible();
  });

  test('intake page is reachable', async ({ page }) => {
    await page.goto('/meals');

    await expect(page.getByRole('heading', { name: 'Intake' })).toBeVisible();
  });
});
