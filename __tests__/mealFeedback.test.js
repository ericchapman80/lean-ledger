import { describe, expect, it } from 'vitest';
import { getMealFeedback } from '@/lib/mealFeedback.js';

function buildSection(overrides = {}) {
  return {
    mealType: 'breakfast',
    label: 'Breakfast',
    totals: {
      calories: 520,
      protein: 35,
      carbs: 40,
      netCarbs: 28,
      fat: 18,
      fiber: 12,
      ...overrides,
    },
  };
}

describe('getMealFeedback', () => {
  it('calls out strong protein meals first', () => {
    expect(getMealFeedback(buildSection(), 'balanced')).toEqual(
      expect.objectContaining({
        shortLabel: 'Protein anchor',
        tone: 'positive',
      }),
    );
  });

  it('flags low-protein meals', () => {
    expect(getMealFeedback(buildSection({ protein: 14 }), 'balanced')).toEqual(
      expect.objectContaining({
        shortLabel: 'Protein light',
        tone: 'neutral',
      }),
    );
  });

  it('uses net carb feedback for keto-style plans', () => {
    expect(getMealFeedback(buildSection({ protein: 18, netCarbs: 10, carbs: 30 }), 'keto')).toEqual(
      expect.objectContaining({
        shortLabel: 'Low net carbs',
      }),
    );
  });

  it('flags higher net carbs before large meal size on low-carb plans', () => {
    expect(getMealFeedback(buildSection({ protein: 18, netCarbs: 34, calories: 900 }), 'low_carb')).toEqual(
      expect.objectContaining({
        shortLabel: 'Net carbs high',
      }),
    );
  });

  it('uses total carbs for balanced diet styles', () => {
    expect(getMealFeedback(buildSection({ protein: 22, carbs: 72, netCarbs: 18 }), 'balanced')).toEqual(
      expect.objectContaining({
        shortLabel: 'Carb heavy',
      }),
    );
  });

  it('falls back to big meal feedback when nothing else is more salient', () => {
    expect(getMealFeedback(buildSection({ protein: 24, carbs: 45, netCarbs: 20, calories: 760 }), 'balanced')).toEqual(
      expect.objectContaining({
        shortLabel: 'Big meal',
      }),
    );
  });

  it('returns null when no feedback rule applies', () => {
    expect(getMealFeedback(buildSection({ protein: 24, carbs: 30, netCarbs: 18, calories: 540 }), 'balanced')).toBeNull();
  });
});
