import { expect, test } from '@playwright/test';

// These checks run unauthenticated against a deployed environment.
// When AUTH_ENABLED=true, the app intentionally returns 401 from data routes
// and the client redirects page loads to /login, so the read-only checks must
// accept either the single-user (no-auth) UI or the login wall. This mirrors
// the auth-aware tolerance in scripts/smoke-test.mjs.

async function getAuthMode(request) {
  const health = await request.get('/api/health');
  expect(health.ok()).toBeTruthy();
  const body = await health.json();
  expect(body.status).toBe('ok');
  return body.authMode;
}

const loginHeading = (page) => page.getByRole('heading', { name: 'Account & Access' });

test.describe('deployed read-only checks', () => {
  test('dashboard renders without server errors', async ({ page, request }) => {
    const authMode = await getAuthMode(request);

    const profile = await request.get('/api/profile');
    // 200 = profile exists, 404 = no profile yet, 401 = auth enabled + unauthenticated
    expect([200, 401, 404]).toContain(profile.status());

    await page.goto('/');

    if (authMode === 'enabled') {
      await expect(loginHeading(page)).toBeVisible();
    } else {
      await expect(page.getByText(/Daily Dashboard|Complete Your Profile|Profile not found/i)).toBeVisible();
    }
  });

  test('intake page is reachable', async ({ page, request }) => {
    const authMode = await getAuthMode(request);

    await page.goto('/meals');

    if (authMode === 'enabled') {
      await expect(loginHeading(page)).toBeVisible();
    } else {
      await expect(page.getByRole('heading', { name: 'Intake', exact: true })).toBeVisible();
    }
  });

  test('profile page is reachable', async ({ page, request }) => {
    const authMode = await getAuthMode(request);

    await page.goto('/profile');

    if (authMode === 'enabled') {
      await expect(loginHeading(page)).toBeVisible();
    } else {
      await expect(
        page.getByRole('heading', {
          name: /Your Profile|Edit Profile|Let’s build your coaching profile/i,
        }),
      ).toBeVisible();
    }
  });
});
