import { describe, expect, it } from 'vitest';
import { getProgressSemantics, getWaterProgressSemantics } from '@/lib/dashboardProgress.js';

describe('getProgressSemantics', () => {
  it('treats protein overages as positive, not negative', () => {
    const result = getProgressSemantics({
      macroKey: 'protein',
      current: 220,
      target: 180,
      dietStyle: 'keto',
    });

    expect(result.state).toBe('excellent');
    expect(result.overBy).toBe(40);
    expect(result.amountLabel).toBe('+40g');
  });

  it('uses strict carb thresholds for keto and low carb modes', () => {
    expect(getProgressSemantics({
      macroKey: 'carbs',
      current: 30,
      target: 50,
      dietStyle: 'keto',
    }).state).toBe('excellent');

    expect(getProgressSemantics({
      macroKey: 'carbs',
      current: 45,
      target: 50,
      dietStyle: 'keto',
    }).state).toBe('warning');

    expect(getProgressSemantics({
      macroKey: 'carbs',
      current: 60,
      target: 50,
      dietStyle: 'keto',
    }).state).toBe('over');
  });

  it('uses softer calorie overage thresholds', () => {
    expect(getProgressSemantics({
      macroKey: 'calories',
      current: 2200,
      target: 2200,
      dietStyle: 'balanced',
    }).state).toBe('excellent');

    expect(getProgressSemantics({
      macroKey: 'calories',
      current: 2300,
      target: 2200,
      dietStyle: 'balanced',
    }).state).toBe('warning');

    expect(getProgressSemantics({
      macroKey: 'calories',
      current: 2500,
      target: 2200,
      dietStyle: 'balanced',
    }).state).toBe('over');
  });

  it('shows real overages instead of capping the percentage display', () => {
    const result = getProgressSemantics({
      macroKey: 'carbs',
      current: 93,
      target: 35,
      dietStyle: 'keto',
    });

    expect(result.percentage).toBe(266);
    expect(result.cappedPercentage).toBe(100);
    expect(result.amountLabel).toBe('+58g');
    expect(result.ratioLabel).toBe('93/35g');
  });

  it('treats water as encouraging instead of punitive', () => {
    const low = getWaterProgressSemantics({
      current: 40,
      target: 116,
      currentHour: 18,
      isCurrentDay: true,
    });
    expect(low.state).toBe('warning');
    expect(low.remaining).toBe(76);

    expect(getWaterProgressSemantics({
      current: 100,
      target: 116,
      currentHour: 14,
      isCurrentDay: true,
    }).state).toBe('excellent');

    const over = getWaterProgressSemantics({
      current: 132,
      target: 116,
      currentHour: 20,
      isCurrentDay: true,
    });

    expect(over.state).toBe('info');
    expect(over.stateLabel).toBe('Hydrated');
    expect(over.overBy).toBe(16);
    expect(over.colorVar).toBe('var(--primary-color)');
  });
});
