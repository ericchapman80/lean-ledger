import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanupHousehold, endDb, hasDb, seedHouseholdWithTwoProfiles } from './profileFixtures.js';
import * as FavoriteFood from '@/lib/models/favoriteFood.js';
import * as FavoriteBeverage from '@/lib/models/favoriteBeverage.js';
import * as FavoriteMeal from '@/lib/models/favoriteMeal.js';
import * as HabitDefinition from '@/lib/models/habitDefinition.js';
import * as DailyHabitLog from '@/lib/models/dailyHabitLog.js';

const d = hasDb ? describe : describe.skip;

afterAll(async () => {
  await endDb();
});

d('favorite_foods profile isolation (real DB)', () => {
  let fx;
  const food = (profileId) => ({
    userId: fx.user.id, profileId, name: 'Eggs', defaultMealType: 'breakfast',
    portionAmount: 2, portionUnit: 'each', portionGrams: 100,
    protein: 12, fat: 10, carbs: 1, fiber: 0, sugarAlcohols: 0, calories: 140,
  });
  let foodA;
  let foodB;

  beforeAll(async () => {
    fx = await seedHouseholdWithTwoProfiles();
    foodA = await FavoriteFood.create(food(fx.profileA.id));
    foodB = await FavoriteFood.create(food(fx.profileB.id)); // identical signature, different profile
  });
  afterAll(async () => { if (fx) await cleanupHousehold(fx); });

  it('allows identical favorites across profiles (per-profile uniqueness)', async () => {
    expect(foodA.id).not.toBe(foodB.id);
    expect((await FavoriteFood.findByProfile(fx.profileA.id)).length).toBe(1);
    expect((await FavoriteFood.findByProfile(fx.profileB.id)).length).toBe(1);
  });

  it('findExactMatch and remove are profile-scoped', async () => {
    expect((await FavoriteFood.findExactMatch(food(fx.profileA.id))).id).toBe(foodA.id);
    expect(await FavoriteFood.remove(foodB.id, fx.profileA.id)).toBe(false);
    expect(await FavoriteFood.remove(foodB.id, fx.profileB.id)).toBe(true);
  });
});

d('favorite_beverages profile isolation (real DB)', () => {
  let fx;
  const bev = (profileId) => ({
    userId: fx.user.id, profileId, name: 'Coffee', beverageType: 'coffee', displayName: null,
    amount: 12, unit: 'fl_oz', amountFlOz: 12, countsTowardHydration: true,
    calories: 5, protein: 0, carbs: 1, fat: 0, caffeineMg: 95,
  });
  let bevB;

  beforeAll(async () => {
    fx = await seedHouseholdWithTwoProfiles();
    await FavoriteBeverage.create(bev(fx.profileA.id));
    bevB = await FavoriteBeverage.create(bev(fx.profileB.id));
  });
  afterAll(async () => { if (fx) await cleanupHousehold(fx); });

  it('scopes list + dedup + remove to the profile', async () => {
    expect((await FavoriteBeverage.findByProfile(fx.profileA.id)).length).toBe(1);
    expect((await FavoriteBeverage.findExactMatch(bev(fx.profileB.id))).id).toBe(bevB.id);
    expect(await FavoriteBeverage.remove(bevB.id, fx.profileA.id)).toBe(false);
    expect(await FavoriteBeverage.remove(bevB.id, fx.profileB.id)).toBe(true);
  });
});

d('favorite_meals profile isolation (real DB)', () => {
  let fx;
  const meal = (profileId) => ({
    userId: fx.user.id, profileId, name: 'Breakfast', mealType: 'breakfast',
    protein: 30, fat: 12, carbs: 20, fiber: 2, sugarAlcohols: 0, calories: 320,
    items: [{ foodName: 'Eggs', portionAmount: 2, portionUnit: 'each', portionGrams: 100, protein: 12, fat: 10, carbs: 1, fiber: 0, sugarAlcohols: 0, calories: 140 }],
  });
  let mealB;

  beforeAll(async () => {
    fx = await seedHouseholdWithTwoProfiles();
    await FavoriteMeal.create(meal(fx.profileA.id));
    mealB = await FavoriteMeal.create(meal(fx.profileB.id));
  });
  afterAll(async () => { if (fx) await cleanupHousehold(fx); });

  it('scopes list/findById/remove and keeps child items with the parent', async () => {
    expect((await FavoriteMeal.findByProfile(fx.profileA.id)).length).toBe(1);
    expect(mealB.items.length).toBe(1);
    expect(await FavoriteMeal.findById(mealB.id, fx.profileA.id)).toBeNull();
    expect((await FavoriteMeal.findById(mealB.id, fx.profileB.id)).id).toBe(mealB.id);
    expect(await FavoriteMeal.remove(mealB.id, fx.profileA.id)).toBe(false);
    expect(await FavoriteMeal.remove(mealB.id, fx.profileB.id)).toBe(true);
  });
});

d('habit_definitions + daily_habit_logs profile isolation (real DB)', () => {
  let fx;
  let habitA;
  let habitB;

  beforeAll(async () => {
    fx = await seedHouseholdWithTwoProfiles();
    habitA = await HabitDefinition.create(fx.profileA.id, { name: 'Mobility' }, fx.user.id);
    habitB = await HabitDefinition.create(fx.profileB.id, { name: 'Reading' }, fx.user.id);
  });
  afterAll(async () => { if (fx) await cleanupHousehold(fx); });

  it('scopes habit definitions per profile', async () => {
    expect((await HabitDefinition.findByProfile(fx.profileA.id)).map((h) => h.name)).toEqual(['Mobility']);
    expect(await HabitDefinition.findById(fx.profileA.id, habitB.id)).toBeNull();
    expect(await HabitDefinition.update(fx.profileA.id, habitB.id, { name: 'HACK' })).toBeNull();
    expect(await HabitDefinition.deleteById(fx.profileA.id, habitB.id)).toBe(false);
  });

  it('scopes daily habit logs per profile and dedups per (profile, habit, date)', async () => {
    const date = '2030-06-01';
    await DailyHabitLog.upsert(fx.profileA.id, { habitId: habitA.id, date, completed: true }, fx.user.id);
    await DailyHabitLog.upsert(fx.profileB.id, { habitId: habitB.id, date, completed: false }, fx.user.id);

    const aLogs = await DailyHabitLog.findByProfileAndDateRange(fx.profileA.id, date, date);
    expect(aLogs.map((l) => l.habitId)).toEqual([habitA.id]);
    expect(aLogs[0].completed).toBe(true);

    // re-upsert updates the same row, not a duplicate
    await DailyHabitLog.upsert(fx.profileA.id, { habitId: habitA.id, date, completed: false }, fx.user.id);
    const after = await DailyHabitLog.findByProfileAndDateRange(fx.profileA.id, date, date);
    expect(after.length).toBe(1);
    expect(after[0].completed).toBe(false);
  });
});
