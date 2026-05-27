import { describe, expect, it } from 'vitest';
import {
  buildCarbTrackingSummary,
  calculateNetCarbs,
  getPrimaryCarbLabel,
  usesNetCarbs,
} from '@/lib/carbUtils.js';

describe('carb utils', () => {
  it('calculates net carbs from total carbs, fiber, and sugar alcohols', () => {
    expect(calculateNetCarbs(16, 10, 3)).toBe(3);
  });

  it('treats missing fiber and sugar alcohols as zero', () => {
    expect(calculateNetCarbs(16, null, undefined)).toBe(16);
  });

  it('prevents negative net carbs', () => {
    expect(calculateNetCarbs(6, 5, 4)).toBe(0);
  });

  it('uses total carbs for balanced mode and net carbs for low carb modes', () => {
    expect(usesNetCarbs('balanced')).toBe(false);
    expect(usesNetCarbs('low_carb')).toBe(true);
    expect(usesNetCarbs('keto')).toBe(true);
    expect(getPrimaryCarbLabel('balanced')).toBe('Carbs');
    expect(getPrimaryCarbLabel('keto')).toBe('Net Carbs');
  });

  it('builds dashboard carb tracking with the correct basis label', () => {
    expect(buildCarbTrackingSummary({
      dietStyle: 'balanced',
      totals: { carbs: 42, fiber: 10, sugarAlcohols: 2 },
      targetCarbs: 180,
    })).toMatchObject({
      label: 'Carbs',
      current: 42,
      target: 180,
      netCarbs: 30,
    });

    expect(buildCarbTrackingSummary({
      dietStyle: 'keto',
      totals: { carbs: 42, fiber: 10, sugarAlcohols: 2 },
      targetCarbs: 35,
    })).toMatchObject({
      label: 'Net Carbs',
      current: 30,
      target: 35,
    });
  });
});
