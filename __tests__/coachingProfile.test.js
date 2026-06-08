import { describe, expect, it } from 'vitest';
import {
  calculateAgeFromDateOfBirth,
  deriveAgeGroup,
  deriveCoachingMode,
  mapGoalStrategyToLegacyGoal,
  normalizeActivityFocus,
} from '@/lib/coachingProfile.js';

describe('calculateAgeFromDateOfBirth', () => {
  it('derives age from date of birth', () => {
    const referenceDate = new Date('2026-06-07T12:00:00Z');
    expect(calculateAgeFromDateOfBirth('2010-06-08', referenceDate)).toBe(15);
    expect(calculateAgeFromDateOfBirth('2010-06-07', referenceDate)).toBe(16);
  });
});

describe('deriveAgeGroup', () => {
  it('maps derived ages into child, teen, and adult groups', () => {
    expect(deriveAgeGroup({ age: 12 })).toBe('child');
    expect(deriveAgeGroup({ age: 15 })).toBe('teen');
    expect(deriveAgeGroup({ age: 30 })).toBe('adult');
  });
});

describe('normalizeActivityFocus', () => {
  it('deduplicates values and clears none when a real focus exists', () => {
    expect(normalizeActivityFocus(['none', 'football', 'football'])).toEqual(['football']);
  });
});

describe('deriveCoachingMode', () => {
  it('derives youth athlete and adult performance modes', () => {
    expect(deriveCoachingMode({
      ageGroup: 'teen',
      goalStrategy: 'performance_fueling',
      activityFocus: ['football'],
    })).toBe('youth_athlete');

    expect(deriveCoachingMode({
      ageGroup: 'adult',
      goalStrategy: 'performance_fueling',
      activityFocus: ['strength_training'],
    })).toBe('athlete_performance');
  });
});

describe('mapGoalStrategyToLegacyGoal', () => {
  it('preserves compatibility with the current macro engine', () => {
    expect(mapGoalStrategyToLegacyGoal('fat_loss')).toBe('lose');
    expect(mapGoalStrategyToLegacyGoal('lean_recomp')).toBe('recomp');
    expect(mapGoalStrategyToLegacyGoal('performance_fueling')).toBe('maintain');
  });
});
