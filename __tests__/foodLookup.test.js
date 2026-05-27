import { describe, expect, it } from 'vitest';
import { parseProductData, parseUSDAFood } from '@/lib/foodLookup.js';

describe('foodLookup carb detail parsing', () => {
  it('maps fiber and sugar alcohols from barcode product data when available', () => {
    const result = parseProductData({
      code: '123',
      product_name: 'High Fiber Wrap',
      serving_quantity: 50,
      serving_quantity_unit: 'g',
      nutriments: {
        proteins_100g: 20,
        carbohydrates_100g: 32,
        fiber_100g: 30,
        'sugar-alcohol_100g': 2,
        fat_100g: 8,
        'energy-kcal_100g': 240,
      },
    });

    expect(result.carbs).toBe(16);
    expect(result.fiber).toBe(15);
    expect(result.sugarAlcohols).toBe(1);
    expect(result.netCarbs).toBe(0);
  });

  it('maps fiber from USDA foods and derives net carbs', () => {
    const result = parseUSDAFood({
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
