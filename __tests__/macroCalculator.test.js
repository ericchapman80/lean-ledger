import { describe, it, expect } from 'vitest';
import {
  calculateBMR,
  calculateTDEE,
  calculateTargetCalories,
  calculateMacros,
  getRecommendedMacros,
} from '@/lib/macroCalculator.js';

describe('calculateBMR (Mifflin-St Jeor)', () => {
  it('matches reference value for a 30y/175cm/75kg male', () => {
    // 10*75 + 6.25*175 - 5*30 + 5 = 750 + 1093.75 - 150 + 5 = 1698.75 → 1699
    expect(calculateBMR(30, 175, 75, 'male')).toBe(1699);
  });

  it('matches reference value for a 30y/165cm/60kg female', () => {
    // 10*60 + 6.25*165 - 5*30 - 161 = 600 + 1031.25 - 150 - 161 = 1320.25 → 1320
    expect(calculateBMR(30, 165, 60, 'female')).toBe(1320);
  });

  it('uses an averaged constant for non-binary gender', () => {
    // 10*70 + 6.25*170 - 5*30 - 78 = 700 + 1062.5 - 150 - 78 = 1534.5 → 1535
    expect(calculateBMR(30, 170, 70, 'other')).toBe(1535);
  });
});

describe('calculateTDEE', () => {
  it.each([
    ['sedentary',   1.2],
    ['light',       1.375],
    ['moderate',    1.55],
    ['active',      1.725],
    ['very_active', 1.9],
  ])('applies the %s multiplier (%s)', (level, multiplier) => {
    const bmr = 1700;
    expect(calculateTDEE(bmr, level)).toBe(Math.round(bmr * multiplier));
  });

  it('defaults to sedentary for an unknown level', () => {
    expect(calculateTDEE(1700, 'lounging')).toBe(Math.round(1700 * 1.2));
  });
});

describe('calculateTargetCalories', () => {
  it('subtracts 500 for weight loss', () => {
    expect(calculateTargetCalories(2500, 'lose')).toBe(2000);
  });
  it('returns TDEE unchanged for maintenance', () => {
    expect(calculateTargetCalories(2500, 'maintain')).toBe(2500);
  });
  it('adds 300 for muscle gain', () => {
    expect(calculateTargetCalories(2500, 'gain')).toBe(2800);
  });
});

describe('calculateMacros', () => {
  it('produces correct grams for the loss ratio (35/25/40)', () => {
    const m = calculateMacros(2000, 'lose');
    // 35% protein @ 4cal/g, 25% fat @ 9, 40% carbs @ 4
    expect(m.protein).toBe(Math.round(2000 * 0.35 / 4));   // 175
    expect(m.fat).toBe(Math.round(2000 * 0.25 / 9));       // 56
    expect(m.carbs).toBe(Math.round(2000 * 0.40 / 4));     // 200
    expect(m.calories).toBe(2000);
  });

  it('produces correct grams for the gain ratio (30/25/45)', () => {
    const m = calculateMacros(3000, 'gain');
    expect(m.protein).toBe(Math.round(3000 * 0.30 / 4));   // 225
    expect(m.fat).toBe(Math.round(3000 * 0.25 / 9));       // 83
    expect(m.carbs).toBe(Math.round(3000 * 0.45 / 4));     // 338
  });
});

describe('getRecommendedMacros (orchestrator)', () => {
  it('returns a complete object with bmr/tdee/macros', () => {
    const result = getRecommendedMacros(30, 175, 75, 'male', 'moderate', 'maintain');
    expect(result).toHaveProperty('bmr');
    expect(result).toHaveProperty('tdee');
    expect(result).toHaveProperty('protein');
    expect(result).toHaveProperty('fat');
    expect(result).toHaveProperty('carbs');
    expect(result).toHaveProperty('calories');
    expect(result.calories).toBe(result.tdee);
  });

  it('calculates a Lean Recomp target with a dynamic deficit and high protein', () => {
    const result = getRecommendedMacros(35, 180, 104.8, 'male', 'moderate', 'recomp', 'keto');
    expect(result.deficit).toBeGreaterThanOrEqual(300);
    expect(result.deficit).toBeLessThanOrEqual(500);
    expect(result.calories).toBe(result.tdee - result.deficit);
    expect(result.protein).toBeGreaterThanOrEqual(180);
    expect(result.protein).toBeLessThanOrEqual(220);
    expect(result.carbs).toBeGreaterThanOrEqual(20);
    expect(result.carbs).toBeLessThanOrEqual(50);
  });

  it('uses flexible weekend carbs for keto flexible Lean Recomp', () => {
    const result = getRecommendedMacros(
      35,
      180,
      95,
      'male',
      'active',
      'recomp',
      'keto_flexible',
      { date: '2026-05-24' },
    );
    expect(result.carbs).toBeGreaterThanOrEqual(100);
    expect(result.carbs).toBeLessThanOrEqual(175);
    expect(result.protein * 4 + result.carbs * 4 + result.fat * 9).toBeGreaterThanOrEqual(result.calories - 9);
  });
});
