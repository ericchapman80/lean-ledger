import { describe, it, expect } from 'vitest';
import { calculateWeeklyNutritionSummary } from '@/lib/weeklyStats.js';
import { formatDate } from '@/lib/utils/dateUtils.js';

describe('calculateWeeklyNutritionSummary', () => {
  it('calculates weekly targets, averages, remaining totals, and focus metrics', () => {
    const result = calculateWeeklyNutritionSummary({
      date: '2026-05-20',
      targets: { calories: 2200, protein: 200 },
      meals: [
        { date: '2026-05-18', calories: 2100, protein: 190 },
        { date: '2026-05-19', calories: 2300, protein: 205 },
        { date: '2026-05-20', calories: 2000, protein: 210 },
      ],
      beverages: [
        { date: '2026-05-18', calories: 160, protein: 30 },
      ],
      weights: [
        { date: '2026-05-18', weight: 100 },
        { date: '2026-05-19', weight: 99.5 },
        { date: '2026-05-20', weight: 99 },
      ],
    });

    expect(result.dailyTargets.calories).toBe(2200);
    expect(result.weeklyTargets.calories).toBe(15400);
    expect(result.weeklyTargets.protein).toBe(1400);
    expect(result.averages.calories).toBe(2187);
    expect(result.averages.protein).toBe(212);
    expect(result.remaining.calories).toBe(8840);
    expect(result.remaining.protein).toBe(765);
    expect(result.focus.sevenDayAverageWeight).toBe(99.5);
    expect(result.focus.proteinConsistency).toEqual({ daysHit: 3, totalDays: 3, percentage: 100 });
  });

  it('uses the local day key when a UTC timestamp crosses midnight', () => {
    const localDate = formatDate('2026-05-26T02:16:00.000Z', { timeZone: 'America/New_York' });
    const result = calculateWeeklyNutritionSummary({
      date: localDate,
      targets: { calories: 2200, protein: 200 },
      meals: [{ date: '2026-05-25', calories: 2100, protein: 190 }],
      beverages: [],
      weights: [],
    });

    expect(localDate).toBe('2026-05-25');
    expect(result.weekStart).toBe('2026-05-25');
    expect(result.elapsedDays).toBe(1);
  });
});
