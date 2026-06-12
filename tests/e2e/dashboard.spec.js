import { expect, test } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

function getIsolatedDate() {
  const daysAhead = 30 + Math.floor(Math.random() * 700);
  return new Date(Date.now() + daysAhead * 86400000).toISOString().slice(0, 10);
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

async function seedProfile(request) {
  const response = await request.post('/api/profile', {
    data: {
      dateOfBirth: '1992-06-07',
      height: 180,
      weight: 90,
      gender: 'male',
      activityLevel: 'moderate',
      goalStrategy: 'lean_recomp',
      activityFocus: ['general_fitness'],
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
  test.skip(
    process.env.PLAYWRIGHT_ALLOW_MUTATION !== 'true' || Boolean(process.env.PLAYWRIGHT_BASE_URL),
    'This suite seeds test data and is only for local/CI databases.',
  );

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
    await page.getByRole('heading', { name: 'Daily Dashboard' }).waitFor();
    await page.locator('input[type="date"]').first().fill(testDate);

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
    await page.getByRole('heading', { name: 'Intake', exact: true }).waitFor();
    await page.locator('input[type="date"]').first().fill(testDate);

    await expect(page.getByRole('heading', { name: 'Dinner' })).toBeVisible();
    await expect(page.getByText('Salmon')).toBeVisible();
    await expect(page.getByText('8 ounces • 226.8g')).toBeVisible();
  });

  test('applies a Daily Wins template from profile and reflects it on intake and dashboard', async ({ page, request }) => {
    const testDate = getIsolatedDate();
    const challengeStartDate = getTodayDate();
    await seedProfile(request);
    const mobilityHabitResponse = await request.post('/api/habit-definitions', {
      data: {
        name: 'Mobility',
        isActive: true,
      },
    });
    expect(mobilityHabitResponse.ok()).toBeTruthy();
    const templateProfileResponse = await request.post('/api/profile', {
      data: {
        dateOfBirth: '1992-06-07',
        height: 180,
        weight: 90,
        gender: 'male',
        activityLevel: 'moderate',
        goalStrategy: 'lean_recomp',
        activityFocus: ['general_fitness'],
        goal: 'recomp',
        dietStyle: 'keto_flexible',
        units: 'imperial',
        dailyWinsActiveKeys: ['workoutCompleted', 'readingCompleted', 'prayerCompleted', 'sleepHours', 'energyLevel'],
        dailyWinsTemplateKey: 'faith_and_fitness',
        dailyWinsChallengeStartDate: challengeStartDate,
      },
    });
    expect(templateProfileResponse.ok()).toBeTruthy();

    await page.goto('/meals');
    await page.getByRole('heading', { name: 'Intake', exact: true }).waitFor();
    await page.locator('input[type="date"]').first().fill(testDate);

    const todaysWinsCard = page.locator('.card').filter({ has: page.getByRole('heading', { name: /Today.?s Wins/i }) }).first();
    await expect(todaysWinsCard.getByText('Workout', { exact: true })).toBeVisible();
    await expect(todaysWinsCard.getByText('Reading', { exact: true })).toBeVisible();
    await expect(todaysWinsCard.getByText('Prayer', { exact: true })).toBeVisible();
    await expect(todaysWinsCard.getByText('Sleep', { exact: true })).toBeVisible();
    await expect(todaysWinsCard.getByText('Energy', { exact: true })).toBeVisible();
    await expect(todaysWinsCard.getByText('Mobility', { exact: true })).toBeVisible();

    await page.goto('/');
    await page.getByRole('heading', { name: 'Daily Dashboard' }).waitFor();
    await page.locator('input[type="date"]').first().fill(testDate);
    await expect(page.getByRole('heading', { name: 'Daily Wins' })).toBeVisible();
  });
});
