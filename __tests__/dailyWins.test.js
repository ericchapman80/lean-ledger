import { describe, expect, it } from 'vitest';
import {
  DAILY_WIN_DEFINITIONS,
  DEFAULT_DAILY_WIN_KEYS,
  getActiveDailyWinDefinitions,
  getDailyWinsSummary,
  getEmptyDailyWins,
  isDailyWinComplete,
  normalizeDailyWinKeys,
} from '@/lib/dailyWins.js';

describe('daily wins helpers', () => {
  it('builds empty daily wins state from a selected date', () => {
    expect(getEmptyDailyWins('2026-06-01')).toMatchObject({
      recordedAt: '2026-06-01T20:00',
      workoutCompleted: '',
      readingCompleted: '',
      prayerCompleted: '',
      sleepHours: '',
      energyLevel: '',
      sorenessLevel: '',
    });
  });

  it('counts complete boolean and rating wins consistently', () => {
    const values = {
      workoutCompleted: 'true',
      readingCompleted: 'false',
      prayerCompleted: 'true',
      sleepHours: '8',
      energyLevel: '4',
      sorenessLevel: '',
    };

    expect(isDailyWinComplete(DAILY_WIN_DEFINITIONS[0], values)).toBe(true);
    expect(isDailyWinComplete(DAILY_WIN_DEFINITIONS[1], values)).toBe(false);
    expect(getDailyWinsSummary(values)).toEqual({
      completed: 4,
      total: 6,
      percentage: 67,
    });
  });

  it('normalizes configured active keys and preserves order', () => {
    expect(normalizeDailyWinKeys(['sleepHours', 'workoutCompleted', 'sleepHours', 'bogus'])).toEqual([
      'sleepHours',
      'workoutCompleted',
    ]);
    expect(normalizeDailyWinKeys([])).toEqual(DEFAULT_DAILY_WIN_KEYS);
  });

  it('builds summaries against only the active configured wins', () => {
    const activeDefinitions = getActiveDailyWinDefinitions(['sleepHours', 'workoutCompleted', 'energyLevel']);
    const values = {
      workoutCompleted: 'true',
      sleepHours: '8',
      energyLevel: '',
    };

    expect(getDailyWinsSummary(values, activeDefinitions)).toEqual({
      completed: 2,
      total: 3,
      percentage: 67,
    });
  });
});
