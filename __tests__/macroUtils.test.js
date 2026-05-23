import { describe, it, expect } from 'vitest';
import {
  calculateCaloriesFromMacros,
  getProgressColor,
  formatMacroValue,
  getActivityLevelDescription,
  getGoalDescription,
} from '@/lib/utils/macroUtils.js';

describe('calculateCaloriesFromMacros', () => {
  it('uses 4/9/4 kcal/g for protein/fat/carbs', () => {
    expect(calculateCaloriesFromMacros(50, 20, 100)).toBe(50 * 4 + 20 * 9 + 100 * 4);
  });
  it('returns 0 for all zeros', () => {
    expect(calculateCaloriesFromMacros(0, 0, 0)).toBe(0);
  });
});

describe('getProgressColor', () => {
  it.each([
    [100, 'success'],
    [85,  'primary'],
    [60,  'warning'],
    [20,  'danger'],
  ])('returns %s for %d%%', (pct, expected) => {
    expect(getProgressColor(pct)).toBe(expected);
  });
});

describe('formatMacroValue', () => {
  it('rounds to one decimal', () => {
    expect(formatMacroValue(12.345)).toBe(12.3);
    expect(formatMacroValue(12.06)).toBe(12.1);
  });
});

describe('getActivityLevelDescription', () => {
  it('returns a description for known levels', () => {
    expect(getActivityLevelDescription('sedentary')).toMatch(/exercise/i);
    expect(getActivityLevelDescription('very_active')).toMatch(/physical job/i);
  });
  it('returns the input for unknown levels', () => {
    expect(getActivityLevelDescription('bouldering')).toBe('bouldering');
  });
});

describe('getGoalDescription', () => {
  it('returns human-readable goals', () => {
    expect(getGoalDescription('lose')).toBe('Weight Loss');
    expect(getGoalDescription('gain')).toBe('Muscle Gain');
  });
});
