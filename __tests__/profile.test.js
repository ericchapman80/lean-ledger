import { describe, it, expect } from 'vitest';
import { enrichProfile, validateProfilePayload } from '@/lib/profile.js';

describe('validateProfilePayload', () => {
  const valid = {
    age: 30, height: 175, weight: 75,
    gender: 'male', activityLevel: 'moderate', goal: 'maintain',
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

  it('accepts a payload with no units field', () => {
    expect(validateProfilePayload(valid)).toBeNull();
  });
});

describe('enrichProfile', () => {
  const user = {
    id: 1,
    age: 30, height: 175, weight: 75,
    gender: 'male', activityLevel: 'moderate', goal: 'maintain',
    units: 'metric',
    customMacros: null,
  };

  it('adds recommendedMacros and activeMacros', () => {
    const result = enrichProfile(user);
    expect(result.recommendedMacros).toHaveProperty('bmr');
    expect(result.recommendedMacros).toHaveProperty('protein');
    expect(result.activeMacros).toHaveProperty('protein');
  });

  it('uses customMacros when present', () => {
    const customed = { ...user, customMacros: { protein: 200, fat: 70, carbs: 250, calories: 2400 } };
    const result = enrichProfile(customed);
    expect(result.activeMacros).toEqual(customed.customMacros);
  });

  it('falls back to recommendedMacros when customMacros is null', () => {
    const result = enrichProfile(user);
    expect(result.activeMacros.protein).toBe(result.recommendedMacros.protein);
    expect(result.activeMacros.calories).toBe(result.recommendedMacros.calories);
  });
});
