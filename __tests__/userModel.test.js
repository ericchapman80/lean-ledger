import { describe, expect, it } from 'vitest';
import { normalizeProfileData } from '@/lib/models/user.js';

describe('normalizeProfileData', () => {
  it('derives age and normalizes onboarding fields before persistence', () => {
    const normalized = normalizeProfileData({
      dateOfBirth: '1996-06-07',
      height: 175,
      weight: 75,
      gender: 'male',
      activityLevel: 'moderate',
      goalStrategy: 'maintenance',
      activityFocus: ['none', 'general_fitness', 'general_fitness'],
    });

    expect(normalized.dateOfBirth).toBe('1996-06-07');
    expect(normalized.age).toBeTypeOf('number');
    expect(normalized.goal).toBe('maintain');
    expect(normalized.goalStrategy).toBe('maintenance');
    expect(normalized.activityFocus).toEqual(['general_fitness']);
    expect(normalized.dietStyle).toBe('balanced');
    expect(normalized.units).toBe('metric');
  });

  it('never leaves undefined persistence values for guided onboarding fields', () => {
    const normalized = normalizeProfileData({
      dateOfBirth: '1996-06-07',
      goalStrategy: 'lean_recomp',
    });

    expect(normalized).toEqual({
      dateOfBirth: '1996-06-07',
      age: expect.any(Number),
      height: null,
      weight: null,
      gender: null,
      activityLevel: null,
      goal: 'recomp',
      goalStrategy: 'lean_recomp',
      activityFocus: [],
      dietStyle: 'balanced',
      units: 'metric',
    });
  });
});
