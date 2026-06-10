import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  cleanupHousehold,
  endDb,
  hasDb,
  seedHouseholdWithTwoProfiles,
} from './profileFixtures.js';
import * as Meal from '@/lib/models/meal.js';

const d = hasDb ? describe : describe.skip;

function mealInput(overrides = {}) {
  return {
    date: '2030-01-15',
    mealName: 'meal',
    mealType: 'breakfast',
    portionAmount: null,
    portionUnit: null,
    portionGrams: null,
    protein: 20,
    fat: 10,
    carbs: 30,
    fiber: null,
    sugarAlcohols: null,
    calories: 290,
    ...overrides,
  };
}

d('meals profile isolation (real DB)', () => {
  const date = '2030-01-15';
  let fx;
  let mealA;
  let mealB;

  beforeAll(async () => {
    fx = await seedHouseholdWithTwoProfiles();
    mealA = await Meal.create(mealInput({ userId: fx.user.id, profileId: fx.profileA.id, mealName: 'A eggs' }));
    mealB = await Meal.create(mealInput({ userId: fx.user.id, profileId: fx.profileB.id, mealName: 'B oatmeal' }));
  });

  afterAll(async () => {
    if (fx) await cleanupHousehold(fx);
    await endDb();
  });

  it('persists the profile_id on create', () => {
    expect(mealA.profileId).toBe(fx.profileA.id);
    expect(mealB.profileId).toBe(fx.profileB.id);
  });

  it('scopes date reads to the active profile only', async () => {
    expect((await Meal.findByProfileAndDate(fx.profileA.id, date)).map((m) => m.mealName)).toEqual(['A eggs']);
    expect((await Meal.findByProfileAndDate(fx.profileB.id, date)).map((m) => m.mealName)).toEqual(['B oatmeal']);
  });

  it('scopes date-range reads to the active profile only', async () => {
    const range = await Meal.findByProfileAndDateRange(fx.profileA.id, '2030-01-01', '2030-01-31');
    expect(range.map((m) => m.mealName)).toEqual(['A eggs']);
  });

  it('findByIdForProfile refuses to read another profile\'s row', async () => {
    expect(await Meal.findByIdForProfile(mealB.id, fx.profileA.id)).toBeNull();
    expect((await Meal.findByIdForProfile(mealB.id, fx.profileB.id)).id).toBe(mealB.id);
  });

  it('update refuses to modify another profile\'s row', async () => {
    const result = await Meal.update(mealB.id, fx.profileA.id, mealInput({ mealName: 'HACKED' }));
    expect(result).toBeNull();
    expect((await Meal.findByIdForProfile(mealB.id, fx.profileB.id)).mealName).toBe('B oatmeal');
  });

  it('remove refuses to delete another profile\'s row, but the owner can', async () => {
    expect(await Meal.remove(mealB.id, fx.profileA.id)).toBe(false);
    expect(await Meal.findByIdForProfile(mealB.id, fx.profileB.id)).not.toBeNull();

    expect(await Meal.remove(mealB.id, fx.profileB.id)).toBe(true);
    expect(await Meal.findByIdForProfile(mealB.id, fx.profileB.id)).toBeNull();
  });
});
