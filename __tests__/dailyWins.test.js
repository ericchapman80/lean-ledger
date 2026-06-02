import { describe, expect, it } from 'vitest';
import { DAILY_WIN_DEFINITIONS, getDailyWinsSummary, getEmptyDailyWins, isDailyWinComplete } from '@/lib/dailyWins.js';

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
});
