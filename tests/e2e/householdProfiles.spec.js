import { expect, test } from '@playwright/test';

// End-to-end proof of V2.2 Family Profiles through the browser: create a
// dependent via the Household UI, switch to it, and confirm per-profile data
// isolation + youth-safe coaching. Seeds data, so it only runs where mutation
// is allowed (local/CI database), matching dashboard.spec.
//
// API calls go through page.evaluate(fetch) so they run in the page's browser
// context and carry the active-profile cookie set when switching.
// Stateful (seeds rows); no retries so a retry can't re-run against dirty state.
test.describe.configure({ mode: 'serial', retries: 0 });

test.describe('household profiles: create, switch, isolate', () => {
  test.skip(process.env.PLAYWRIGHT_ALLOW_MUTATION !== 'true', 'This suite seeds test data and is only for local/CI databases.');

  test('create a dependent, switch to it, and isolate data per profile', async ({ page }) => {
    const date = '2031-02-02';

    const apiGet = (path) => page.evaluate((p) => fetch(p).then((r) => r.json()), path);
    const apiPost = (path, data) => page.evaluate(
      ([p, d]) => fetch(p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }).then((r) => r.status),
      [path, data],
    );

    await page.goto('/');

    // Account holder must exist with a complete profile.
    expect(await apiPost('/api/profile', { dateOfBirth: '1988-01-01', height: 183, weight: 95, gender: 'male', activityLevel: 'moderate', goal: 'maintain', goalStrategy: 'maintenance', units: 'metric' })).toBe(200);
    // Log a meal as the primary profile (no switch yet).
    expect(await apiPost('/api/meals', { date, mealName: 'Parent Meal', protein: 40, fat: 20, carbs: 50, calories: 540 })).toBe(201);

    // Create a dependent (a minor) via the Household UI.
    await page.goto('/household');
    await page.getByRole('heading', { name: 'Household profiles' }).waitFor();
    const createProfileCard = page.locator('.card').last();
    await createProfileCard.getByLabel('Name').fill('E2E Kid');
    await createProfileCard.getByLabel('Date of birth').fill('2016-04-01');
    await createProfileCard.getByLabel('Height').fill('150');
    await createProfileCard.getByLabel('Weight').fill('42');
    await createProfileCard.getByRole('button', { name: 'Add profile' }).click();
    await expect(page.getByText('E2E Kid')).toBeVisible();

    // Switch to the kid from its row; the page reloads to re-scope everything.
    const kidRow = page.locator('.card > div').filter({ hasText: 'E2E Kid' });
    await kidRow.getByRole('button', { name: 'Switch to' }).click();
    await expect(kidRow.getByText('active')).toBeVisible();

    // Active profile is now the kid (cookie set). Log a meal as the kid.
    expect(await apiPost('/api/meals', { date, mealName: 'Kid Meal', protein: 10, fat: 5, carbs: 20, calories: 160 })).toBe(201);

    // Per-profile isolation: as the kid we see the kid's meal, never the parent's.
    const kidMealNames = (await apiGet(`/api/meals?date=${date}`)).map((m) => m.mealName);
    expect(kidMealNames).toContain('Kid Meal');
    expect(kidMealNames).not.toContain('Parent Meal');

    // Per-profile coaching: the active profile is the child, youth-safe.
    const kidProfile = await apiGet('/api/profile');
    expect(kidProfile.name).toBe('E2E Kid');
    expect(kidProfile.ageGroup).toBe('child');
    expect(kidProfile.youthSafetyMessage).toBeTruthy();

    // Switch back to the account holder.
    const primaryRow = page.locator('.card > div').filter({ hasText: '(you)' });
    await primaryRow.getByRole('button', { name: 'Switch to' }).click();
    await expect(primaryRow.getByText('active')).toBeVisible();

    // Back as the primary, we see the parent's meal, never the kid's.
    const parentMealNames = (await apiGet(`/api/meals?date=${date}`)).map((m) => m.mealName);
    expect(parentMealNames).toContain('Parent Meal');
    expect(parentMealNames).not.toContain('Kid Meal');
  });
});
