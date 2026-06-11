import { beforeEach, describe, expect, it, vi } from 'vitest';

const getCurrentUserId = vi.fn();
const getActiveProfileId = vi.fn();
const favoriteFoodFindExactMatch = vi.fn();
const favoriteFoodCreate = vi.fn();
const favoriteBeverageFindExactMatch = vi.fn();
const favoriteBeverageCreate = vi.fn();

vi.mock('@/lib/auth', () => ({
  getCurrentUserId,
}));

vi.mock('@/lib/activeProfile', () => ({
  getActiveProfileId,
}));

vi.mock('@/lib/models/favoriteFood', () => ({
  findExactMatch: favoriteFoodFindExactMatch,
  create: favoriteFoodCreate,
}));

vi.mock('@/lib/models/favoriteBeverage', () => ({
  findExactMatch: favoriteBeverageFindExactMatch,
  create: favoriteBeverageCreate,
}));

describe('favorite duplicate prevention routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserId.mockResolvedValue(7);
    getActiveProfileId.mockResolvedValue(7);
  });

  it('returns the existing favorite food instead of creating a duplicate', async () => {
    const existing = { id: 11, name: 'Greek Yogurt' };
    favoriteFoodFindExactMatch.mockResolvedValue(existing);

    const { POST } = await import('@/app/api/favorite-foods/route.js');
    const response = await POST({
      json: async () => ({
        name: 'Greek Yogurt',
        defaultMealType: 'breakfast',
        portionAmount: 1,
        portionUnit: 'cup',
        portionGrams: 227,
        protein: 20,
        fat: 0,
        carbs: 9,
        fiber: 0,
        sugarAlcohols: 0,
        calories: 120,
      }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(existing);
    expect(favoriteFoodCreate).not.toHaveBeenCalled();
  });

  it('returns the existing favorite beverage instead of creating a duplicate', async () => {
    const existing = { id: 21, name: 'Morning Coffee' };
    favoriteBeverageFindExactMatch.mockResolvedValue(existing);

    const { POST } = await import('@/app/api/favorite-beverages/route.js');
    const response = await POST({
      json: async () => ({
        name: 'Morning Coffee',
        beverageType: 'black_coffee',
        amount: 16,
        unit: 'fl_oz',
        amountFlOz: 16,
        countsTowardHydration: true,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        caffeineMg: 120,
      }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(existing);
    expect(favoriteBeverageCreate).not.toHaveBeenCalled();
  });
});
