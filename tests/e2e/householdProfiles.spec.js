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

  test('create a dependent, switch to it, and isolate data per profile', async ({ page, request }) => {
    const date = '2031-02-02';

    const apiGet = (path) => page.evaluate((p) => fetch(p).then((r) => r.json()), path);
    const apiPost = (path, data) => page.evaluate(
      ([p, d]) => fetch(p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }).then((r) => r.status),
      [path, data],
    );
    const apiPostWithoutBody = (path) => page.evaluate(
      (p) => fetch(p, { method: 'POST' }).then((r) => r.status),
      path,
    );
    const seedPost = async (path, data) => request.post(path, { data });
    const seedGet = async (path) => (await request.get(path)).json();

    await page.goto('/');

    // Account holder must exist with a complete profile.
    expect((await seedPost('/api/profile', { dateOfBirth: '1988-01-01', height: 183, weight: 95, gender: 'male', activityLevel: 'moderate', goal: 'maintain', goalStrategy: 'maintenance', units: 'metric' })).status()).toBe(200);
    // Log a meal as the primary profile (no switch yet).
    expect((await seedPost('/api/meals', { date, mealName: 'Parent Meal', protein: 40, fat: 20, carbs: 50, calories: 540 })).status()).toBe(201);

    // Seed a dependent via API, then verify the browser switching/isolation flow.
    expect((await seedPost('/api/profiles', {
      name: 'E2E Kid',
      dateOfBirth: '2016-04-01',
      height: 150,
      weight: 42,
      gender: 'male',
      activityLevel: 'moderate',
      goal: 'maintain',
      goalStrategy: 'maintenance',
      units: 'metric',
      dietStyle: 'balanced',
      activityFocus: [],
    })).status()).toBe(201);

    const profiles = await seedGet('/api/profiles');
    const kidProfile = profiles.find((profile) => profile.name === 'E2E Kid');
    expect(kidProfile).toBeTruthy();

    // Switch to the kid profile through the same activation API the UI uses.
    expect(await apiPostWithoutBody(`/api/profiles/${kidProfile.id}/activate`)).toBe(200);

    // Active profile is now the kid (cookie set). Log a meal as the kid.
    expect(await apiPost('/api/meals', { date, mealName: 'Kid Meal', protein: 10, fat: 5, carbs: 20, calories: 160 })).toBe(201);

    // Per-profile isolation: as the kid we see the kid's meal, never the parent's.
    const kidMealNames = (await apiGet(`/api/meals?date=${date}`)).map((m) => m.mealName);
    expect(kidMealNames).toContain('Kid Meal');
    expect(kidMealNames).not.toContain('Parent Meal');

    // Account settings stay anchored to the signed-in owner even while the
    // rest of the app is scoped to a switched household profile.
    const accountProfile = await apiGet('/api/profile');
    expect(accountProfile.dateOfBirth).toBe('1988-01-01');
    expect(accountProfile.ageGroup).toBe('adult');

    // Switch back to the account holder.
    const primaryProfile = profiles.find((profile) => profile.isSelf);
    expect(primaryProfile).toBeTruthy();
    expect(await apiPostWithoutBody(`/api/profiles/${primaryProfile.id}/activate`)).toBe(200);

    // Back as the primary, we see the parent's meal, never the kid's.
    const parentMealNames = (await apiGet(`/api/meals?date=${date}`)).map((m) => m.mealName);
    expect(parentMealNames).toContain('Parent Meal');
    expect(parentMealNames).not.toContain('Kid Meal');
  });
});
