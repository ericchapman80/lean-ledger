import { describe, expect, it } from 'vitest';
import {
  buildCustomDailyWinDefinitions,
  DAILY_WIN_DEFINITIONS,
  DEFAULT_DAILY_WIN_KEYS,
  getActiveDailyWinDefinitions,
  getCustomDailyHabitPayloads,
  getDailyWinsSummary,
  getDailyWinsValues,
  getEmptyDailyWins,
  isDailyWinComplete,
  mergeDailyWinDefinitions,
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

  it('builds merged suggested and custom definitions plus daily values', () => {
    const customHabits = [
      { id: 10, name: 'Mobility', isActive: true, sortOrder: 1 },
      { id: 11, name: 'No Alcohol', isActive: false, sortOrder: 2 },
      { id: 12, name: 'Journal', isActive: true, sortOrder: 0 },
    ];
    const merged = mergeDailyWinDefinitions(['workoutCompleted'], customHabits);
    const values = getDailyWinsValues('2026-06-02', null, customHabits, [
      { habitId: 10, completed: false },
      { habitId: 12, completed: true },
    ]);

    expect(buildCustomDailyWinDefinitions(customHabits).map((definition) => definition.label)).toEqual(['Journal', 'Mobility']);
    expect(merged.map((definition) => definition.label)).toEqual(['Workout', 'Journal', 'Mobility']);
    expect(values['habit:12']).toBe('true');
    expect(values['habit:10']).toBe('false');
  });

  it('builds custom habit log payloads from merged daily wins state', () => {
    const payloads = getCustomDailyHabitPayloads(
      { 'habit:10': 'true', 'habit:12': 'false', workoutCompleted: 'true' },
      [
        { id: 10, name: 'Mobility', isActive: true, sortOrder: 0 },
        { id: 12, name: 'Journal', isActive: true, sortOrder: 1 },
      ],
      '2026-06-02',
    );

    expect(payloads).toEqual([
      { habitId: 10, date: '2026-06-02', completed: true },
      { habitId: 12, date: '2026-06-02', completed: false },
    ]);
  });
});
