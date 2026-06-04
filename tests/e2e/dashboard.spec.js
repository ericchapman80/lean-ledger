import { expect, test } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

function getIsolatedDate() {
  const daysAhead = 30 + Math.floor(Math.random() * 700);
  return new Date(Date.now() + daysAhead * 86400000).toISOString().slice(0, 10);
}

async function seedProfile(request) {
  const response = await request.post('/api/profile', {
    data: {
      age: 34,
      height: 180,
      weight: 90,
      gender: 'male',
      activityLevel: 'moderate',
      goal: 'recomp',
      dietStyle: 'keto_flexible',
      units: 'imperial',
    },
  });

  expect(response.ok()).toBeTruthy();
}

async function createMeal(request, meal) {
  const response = await request.post('/api/meals', { data: meal });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

test.describe('dashboard and meals flows', () => {
  test.skip(process.env.PLAYWRIGHT_ALLOW_MUTATION !== 'true', 'This suite seeds test data and is only for local/CI databases.');

  test('shows grouped meals separately from food entries on the dashboard', async ({ page, request }) => {
    const testDate = getIsolatedDate();
    await seedProfile(request);
    await createMeal(request, {
      date: testDate,
      mealType: 'breakfast',
      mealName: 'Eggs',
      portionAmount: 2,
      portionUnit: 'serving',
      portionGrams: 100,
      protein: 12,
      fat: 10,
      carbs: 1,
      calories: 140,
    });
    await createMeal(request, {
      date: testDate,
      mealType: 'breakfast',
      mealName: 'Greek Yogurt',
      portionAmount: 1,
      portionUnit: 'cup',
      portionGrams: 227,
      protein: 20,
      fat: 0,
      carbs: 9,
      calories: 120,
    });
    await createMeal(request, {
      date: testDate,
      mealType: 'lunch',
      mealName: 'Chicken Bowl',
      portionAmount: 1,
      portionUnit: 'serving',
      portionGrams: 325,
      protein: 45,
      fat: 16,
      carbs: 18,
      calories: 405,
    });

    await page.goto('/');
    await page.locator('input[type="date"]').fill(testDate);

    await expect(page.getByRole('heading', { name: 'Daily Dashboard' })).toBeVisible();
    const quickStatsCard = page.locator('.card').filter({ has: page.getByRole('heading', { name: 'Quick Stats' }) });
    await expect(quickStatsCard.getByText('Meals Today')).toBeVisible();
    await expect(quickStatsCard.getByText('Foods Logged')).toBeVisible();
    await expect(quickStatsCard.locator('p').filter({ hasText: /^2$/ })).toBeVisible();
    await expect(quickStatsCard.locator('p').filter({ hasText: /^3$/ })).toBeVisible();
    await expect(page.getByText('Breakfast • Lunch')).toBeVisible();
  });

  test('renders meal-first sections on the meals page', async ({ page, request }) => {
    const testDate = getIsolatedDate();
    await seedProfile(request);
    await createMeal(request, {
      date: testDate,
      mealType: 'dinner',
      mealName: 'Salmon',
      portionAmount: 8,
      portionUnit: 'ounces',
      portionGrams: 226.8,
      protein: 48,
      fat: 20,
      carbs: 0,
      calories: 360,
    });

    await page.goto('/meals');
    await page.locator('input[type="date"]').fill(testDate);

    await expect(page.getByRole('heading', { name: 'Dinner' })).toBeVisible();
    await expect(page.getByText('Salmon')).toBeVisible();
    await expect(page.getByText('8 ounces • 226.8g')).toBeVisible();
  });

  test('applies a Daily Wins template from profile and reflects it on intake and dashboard', async ({ page, request }) => {
    const testDate = getIsolatedDate();
    await seedProfile(request);

    await page.goto('/profile');
    await page.getByRole('button', { name: 'Edit Profile' }).click();
    const profileDailyWinsCard = page.locator('.card').filter({ has: page.getByRole('heading', { name: 'Daily Wins' }).first() }).first();
    const profileCustomDailyWinsCard = page.locator('.card').filter({ has: page.getByRole('heading', { name: 'Custom Daily Wins' }) }).first();
    await page.locator('select').filter({ has: page.locator('option[value="faith_and_fitness"]') }).selectOption('faith_and_fitness');
    await page.getByRole('button', { name: 'Apply Template' }).click();
    await expect(profileCustomDailyWinsCard.locator('input[type="text"][value="Mobility"]')).toBeVisible();
    await profileDailyWinsCard.locator('input[type="date"]').fill(testDate);
    await page.getByRole('button', { name: 'Update Profile' }).click();

    await expect(profileDailyWinsCard).toBeVisible();
    await expect(profileDailyWinsCard.getByText('Workout', { exact: true })).toBeVisible();
    await expect(profileDailyWinsCard.getByText('Reading', { exact: true })).toBeVisible();
    await expect(profileDailyWinsCard.getByText('Prayer', { exact: true })).toBeVisible();

    await page.goto('/meals');
    await page.locator('input[type="date"]').fill(testDate);

    const todaysWinsCard = page.locator('.card').filter({ has: page.getByRole('heading', { name: /Today.?s Wins/i }) }).first();
    await expect(todaysWinsCard.getByText('Workout', { exact: true })).toBeVisible();
    await expect(todaysWinsCard.getByText('Reading', { exact: true })).toBeVisible();
    await expect(todaysWinsCard.getByText('Prayer', { exact: true })).toBeVisible();
    await expect(todaysWinsCard.getByText('Sleep', { exact: true })).toBeVisible();
    await expect(todaysWinsCard.getByText('Energy', { exact: true })).toBeVisible();
    await expect(todaysWinsCard.getByText('Mobility', { exact: true })).toBeVisible();

    await page.goto('/');
    await page.locator('input[type="date"]').fill(testDate);
    await expect(page.getByRole('heading', { name: 'Daily Wins' })).toBeVisible();
  });
});
