import { describe, expect, it, vi, beforeEach } from 'vitest';
import { searchFoodDatabase, normalizeOFF, normalizeUSDA } from '@/lib/foodSearch.js';

// ── normalizeOFF ──────────────────────────────────────────────────────────────

describe('normalizeOFF', () => {
  it('maps macros from _100g fields scaled to serving size', () => {
    const result = normalizeOFF({
      code: 'abc123',
      product_name: 'Greek Yogurt',
      brands: 'Chobani',
      serving_quantity: 170,
      serving_quantity_unit: 'g',
      nutriments: {
        'proteins_100g': 10,
        'carbohydrates_100g': 3.5,
        'fiber_100g': 0,
        'fat_100g': 0.4,
        'energy-kcal_100g': 59,
      },
    });

    expect(result.id).toBe('off:abc123');
    expect(result.source).toBe('openfoodfacts');
    expect(result.name).toBe('Greek Yogurt');
    expect(result.brand).toBe('Chobani');
    expect(result.servingSize).toBe(170);
    expect(result.protein).toBe(17);
    expect(result.carbs).toBe(6);
    expect(result.fat).toBeCloseTo(0.7, 1);
    expect(result.calories).toBe(100);
  });

  it('maps fiber and sugar alcohols and derives netCarbs', () => {
    const result = normalizeOFF({
      code: 'wrap1',
      product_name: 'Low Carb Wrap',
      serving_quantity: 50,
      serving_quantity_unit: 'g',
      nutriments: {
        'proteins_100g': 20,
        'carbohydrates_100g': 40,
        'fiber_100g': 20,
        'sugar-alcohol_100g': 10,
        'fat_100g': 8,
        'energy-kcal_100g': 300,
      },
    });

    expect(result.carbs).toBe(20);
    expect(result.fiber).toBe(10);
    expect(result.sugarAlcohols).toBe(5);
    expect(result.netCarbs).toBe(5);
  });

  it('defaults to 100g serving when serving_quantity is absent', () => {
    const result = normalizeOFF({
      code: 'x',
      product_name: 'Test',
      nutriments: { 'proteins_100g': 10, 'fat_100g': 5, 'carbohydrates_100g': 20, 'energy-kcal_100g': 165 },
    });
    expect(result.servingSize).toBe(100);
    expect(result.protein).toBe(10);
  });
});

// ── normalizeUSDA ─────────────────────────────────────────────────────────────

describe('normalizeUSDA', () => {
  it('maps macros from USDA nutrient IDs', () => {
    const result = normalizeUSDA({
      fdcId: 1234,
      description: 'Chicken Breast, raw',
      brandOwner: 'USDA',
      foodNutrients: [
        { nutrientId: 1003, value: 31 },   // protein
        { nutrientId: 1005, value: 0 },    // carbs
        { nutrientId: 1079, value: 0 },    // fiber
        { nutrientId: 1004, value: 3.6 },  // fat
        { nutrientId: 1008, value: 165 },  // calories
      ],
    });

    expect(result.id).toBe('usda:1234');
    expect(result.source).toBe('usda');
    expect(result.name).toBe('Chicken Breast, raw');
    expect(result.protein).toBe(31);
    expect(result.carbs).toBe(0);
    expect(result.fiber).toBe(0);
    expect(result.fat).toBeCloseTo(3.6, 1);
    expect(result.calories).toBe(165);
    expect(result.netCarbs).toBe(0);
    expect(result.servingSize).toBe(100);
    expect(result.servingUnit).toBe('g');
  });

  it('derives netCarbs from carbs minus fiber', () => {
    const result = normalizeUSDA({
      fdcId: 55,
      description: 'Low Carb Tortilla',
      foodNutrients: [
        { nutrientId: 1003, value: 12 },
        { nutrientId: 1005, value: 24 },
        { nutrientId: 1079, value: 18 },
        { nutrientId: 1004, value: 5 },
        { nutrientId: 1008, value: 190 },
      ],
    });

    expect(result.carbs).toBe(24);
    expect(result.fiber).toBe(18);
    expect(result.netCarbs).toBe(6);
  });
});

// ── searchFoodDatabase fallback ───────────────────────────────────────────────

describe('searchFoodDatabase', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.USDA_FOOD_API_KEY;
  });

  it('returns OpenFoodFacts results when OFF has hits and USDA is unavailable', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        products: [{
          code: 'off1',
          product_name: 'Banana',
          serving_quantity: 100,
          serving_quantity_unit: 'g',
          nutriments: { 'proteins_100g': 1, 'carbohydrates_100g': 23, 'fat_100g': 0.3, 'energy-kcal_100g': 89 },
        }],
      }),
    });

    const result = await searchFoodDatabase('banana');

    expect(result.source).toBe('openfoodfacts');
    expect(result.results).toHaveLength(1);
    expect(result.results[0].name).toBe('Banana');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('returns USDA results when OFF is empty', async () => {
    process.env.USDA_FOOD_API_KEY = 'test-key';
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ products: [] }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          foods: [{
            fdcId: 99,
            description: 'Obscure Root Vegetable',
            foodNutrients: [
              { nutrientId: 1003, value: 2 },
              { nutrientId: 1005, value: 10 },
              { nutrientId: 1079, value: 3 },
              { nutrientId: 1004, value: 0 },
              { nutrientId: 1008, value: 50 },
            ],
          }],
        }),
      });

    const result = await searchFoodDatabase('obscure root vegetable');

    expect(result.source).toBe('usda');
    expect(result.results).toHaveLength(1);
    expect(result.results[0].name).toBe('Obscure Root Vegetable');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('returns source:none when both sources are empty', async () => {
    process.env.USDA_FOOD_API_KEY = 'test-key';
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ products: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ foods: [] }) });

    const result = await searchFoodDatabase('xyznotafood');

    expect(result.source).toBe('none');
    expect(result.results).toHaveLength(0);
  });

  it('skips USDA lookup when USDA_FOOD_API_KEY is not set', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ products: [] }) });

    const result = await searchFoodDatabase('noresults');

    expect(result.source).toBe('none');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('merges USDA and OpenFoodFacts results when both sources have hits', async () => {
    process.env.USDA_FOOD_API_KEY = 'test-key';
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          products: [{
            code: 'off-rotisserie',
            product_name: 'Rotisserie Chicken',
            brands: 'Store Brand',
            serving_quantity: 85,
            serving_quantity_unit: 'g',
            nutriments: { 'proteins_100g': 27, 'carbohydrates_100g': 2, 'fat_100g': 8, 'energy-kcal_100g': 190 },
          }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          foods: [{
            fdcId: 777,
            description: 'Chicken, broiler, rotisserie, BBQ, breast, meat only',
            foodNutrients: [
              { nutrientId: 1003, value: 29 },
              { nutrientId: 1005, value: 0.1 },
              { nutrientId: 1079, value: 0 },
              { nutrientId: 1004, value: 7.1 },
              { nutrientId: 1008, value: 183 },
            ],
          }],
        }),
      });

    const result = await searchFoodDatabase('chicken rotisserie bbq breast');

    expect(result.source).toBe('combined');
    expect(result.results).toHaveLength(2);
    expect(result.results.map((food) => food.name)).toContain('Rotisserie Chicken');
    expect(result.results.map((food) => food.name)).toContain('Chicken, broiler, rotisserie, BBQ, breast, meat only');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('ranks exact USDA-style ingredient matches above generic OpenFoodFacts hits', async () => {
    process.env.USDA_FOOD_API_KEY = 'test-key';
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          products: [{
            code: 'off-chicken',
            product_name: 'Chicken Bites',
            brands: 'Snack Co',
            serving_quantity: 28,
            serving_quantity_unit: 'g',
            nutriments: { 'proteins_100g': 18, 'carbohydrates_100g': 16, 'fat_100g': 14, 'energy-kcal_100g': 250 },
          }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          foods: [{
            fdcId: 778,
            description: 'Chicken, broiler, rotisserie, BBQ, breast, meat only',
            foodNutrients: [
              { nutrientId: 1003, value: 29 },
              { nutrientId: 1005, value: 0.1 },
              { nutrientId: 1079, value: 0 },
              { nutrientId: 1004, value: 7.1 },
              { nutrientId: 1008, value: 183 },
            ],
          }],
        }),
      });

    const result = await searchFoodDatabase('Chicken, broiler, rotisserie, BBQ, breast, meat only');

    expect(result.source).toBe('combined');
    expect(result.results[0].source).toBe('usda');
    expect(result.results[0].name).toBe('Chicken, broiler, rotisserie, BBQ, breast, meat only');
  });
});
