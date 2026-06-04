import { describe, it, expect } from 'vitest';
import { enrichProfile, validateProfilePayload } from '@/lib/profile.js';

describe('validateProfilePayload', () => {
  const valid = {
    age: 30, height: 175, weight: 75,
    gender: 'male', activityLevel: 'moderate', goal: 'maintain', dietStyle: 'balanced',
  };

  it('returns null for a valid payload', () => {
    expect(validateProfilePayload(valid)).toBeNull();
  });

  it.each(['age', 'height', 'weight', 'gender', 'activityLevel', 'goal'])(
    'rejects missing %s',
    (field) => {
      const bad = { ...valid, [field]: undefined };
      expect(validateProfilePayload(bad)).toBe('All fields are required');
    },
  );

  it('rejects an invalid gender', () => {
    expect(validateProfilePayload({ ...valid, gender: 'attack-helicopter' }))
      .toBe('Invalid gender');
  });

  it('rejects an invalid activity level', () => {
    expect(validateProfilePayload({ ...valid, activityLevel: 'olympian' }))
      .toBe('Invalid activity level');
  });

  it('rejects an invalid goal', () => {
    expect(validateProfilePayload({ ...valid, goal: 'become-the-rock' }))
      .toBe('Invalid goal');
  });

  it('rejects an invalid units value (when provided)', () => {
    expect(validateProfilePayload({ ...valid, units: 'cubits' }))
      .toBe('Invalid units');
  });

  it('rejects an invalid diet style', () => {
    expect(validateProfilePayload({ ...valid, dietStyle: 'see-food' }))
      .toBe('Invalid diet style');
  });

  it('accepts a payload with no units field', () => {
    expect(validateProfilePayload(valid)).toBeNull();
  });

  it('rejects invalid daily wins configuration', () => {
    expect(validateProfilePayload({ ...valid, dailyWinsActiveKeys: ['workoutCompleted', 'bogus'] }))
      .toBe('Invalid daily wins configuration');
    expect(validateProfilePayload({ ...valid, dailyWinsActiveKeys: [] }))
      .toBeNull();
  });

  it('rejects invalid daily wins template and challenge date', () => {
    expect(validateProfilePayload({ ...valid, dailyWinsTemplateKey: 'bogus' }))
      .toBe('Invalid daily wins template');
    expect(validateProfilePayload({ ...valid, dailyWinsChallengeStartDate: '06/02/2026' }))
      .toBe('Invalid challenge start date');
  });
});

describe('enrichProfile', () => {
  const user = {
    id: 1,
    age: 30, height: 175, weight: 75,
    gender: 'male', activityLevel: 'moderate', goal: 'maintain',
    dietStyle: 'balanced',
    units: 'metric',
    dailyWinsActiveKeys: ['workoutCompleted', 'sleepHours', 'energyLevel'],
    dailyWinsTemplateKey: 'lean_recomp_foundations',
    dailyWinsChallengeStartDate: '2026-06-01',
    customMacros: null,
  };

  it('adds recommendedMacros and activeMacros', () => {
    const result = enrichProfile(user);
    expect(result.recommendedMacros).toHaveProperty('bmr');
    expect(result.recommendedMacros).toHaveProperty('protein');
    expect(result.recommendedMacros.dietStyle).toBe('balanced');
    expect(result.activeMacros).toHaveProperty('protein');
    expect(result.dailyWinsActiveKeys).toEqual(['workoutCompleted', 'sleepHours', 'energyLevel']);
    expect(result.activeDailyWins.map((definition) => definition.key)).toEqual(['workoutCompleted', 'sleepHours', 'energyLevel']);
    expect(result.dailyWinsTemplate?.name).toBe('Lean Recomp Foundations');
  });

  it('uses customMacros when present', () => {
    const customed = { ...user, customMacros: { protein: 200, fat: 70, carbs: 250, calories: 2400 } };
    const result = enrichProfile(customed);
    expect(result.activeMacros).toEqual(customed.customMacros);
    expect(result.hasCustomMacros).toBe(true);
    expect(result.hasMacroOverrides).toBe(true);
    expect(result.macrosMatchRecommendation).toBe(false);
  });

  it('falls back to recommendedMacros when customMacros is null', () => {
    const result = enrichProfile(user);
    expect(result.activeMacros.protein).toBe(result.recommendedMacros.protein);
    expect(result.activeMacros.calories).toBe(result.recommendedMacros.calories);
    expect(result.hasCustomMacros).toBe(false);
    expect(result.hasMacroOverrides).toBe(false);
    expect(result.macrosMatchRecommendation).toBe(true);
  });

  it('treats matching customMacros as non-overrides', () => {
    const baseline = enrichProfile(user);
    const matching = enrichProfile({
      ...user,
      customMacros: {
        protein: baseline.recommendedMacros.protein,
        fat: baseline.recommendedMacros.fat,
        carbs: baseline.recommendedMacros.carbs,
        calories: baseline.recommendedMacros.calories,
      },
    });

    expect(matching.hasCustomMacros).toBe(true);
    expect(matching.hasMacroOverrides).toBe(false);
    expect(matching.macrosMatchRecommendation).toBe(true);
  });
});
