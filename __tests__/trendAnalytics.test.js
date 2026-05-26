import { describe, expect, it } from 'vitest';
import {
  buildDateRange,
  buildTrendAnalytics,
  calculateDailyConsistencyScore,
  calculateRollingAverage,
  calculateWeeklyCalorieAdherence,
  getDietStyleCarbGuidance,
} from '@/lib/trendAnalytics.js';
import { formatDate } from '@/lib/utils/dateUtils.js';

describe('calculateRollingAverage', () => {
  it('computes rolling averages while ignoring null values', () => {
    expect(calculateRollingAverage([100, 99, null, 98, 97], 3))
      .toEqual([100, 99.5, 99.5, 98.5, 97.5]);
  });
});

describe('buildDateRange', () => {
  it('returns an inclusive list of dates', () => {
    expect(buildDateRange('2026-05-18', '2026-05-20'))
      .toEqual(['2026-05-18', '2026-05-19', '2026-05-20']);
  });
});

describe('getDietStyleCarbGuidance', () => {
  it('uses keto weekdays and flexible weekends for keto flexible mode', () => {
    expect(getDietStyleCarbGuidance('keto_flexible', '2026-05-22', 120))
      .toEqual({ min: 20, max: 50, label: 'Keto Weekday', isFlexible: false });
    expect(getDietStyleCarbGuidance('keto_flexible', '2026-05-23', 120))
      .toEqual({ min: 100, max: 175, label: 'Flexible Weekend', isFlexible: true });
  });
});

describe('calculateDailyConsistencyScore', () => {
  it('scores days based on protein and calories when other data is absent', () => {
    const score = calculateDailyConsistencyScore(
      { protein: 180, calories: 2200 },
      { proteinTarget: 200, calorieTarget: 2200 },
    );
    expect(score).toBe(95);
  });
});

describe('calculateWeeklyCalorieAdherence', () => {
  it('measures alignment with the expected weekly pace', () => {
    expect(calculateWeeklyCalorieAdherence({
      dailyTargets: { calories: 2200 },
      elapsedDays: 3,
      consumed: { calories: 6300 },
    })).toBe(95);
  });
});

describe('buildTrendAnalytics', () => {
  it('builds summary metrics and daily series for the trends UI', () => {
    const result = buildTrendAnalytics({
      startDate: '2026-05-18',
      endDate: '2026-05-24',
      mealTrends: [
        { date: '2026-05-18', protein: 180, carbs: 30, fat: 80, calories: 2100, mealCount: 3 },
        { date: '2026-05-19', protein: 205, carbs: 35, fat: 90, calories: 2200, mealCount: 3 },
        { date: '2026-05-20', protein: 210, carbs: 40, fat: 85, calories: 2250, mealCount: 3 },
        { date: '2026-05-21', protein: 190, carbs: 45, fat: 88, calories: 2150, mealCount: 3 },
        { date: '2026-05-22', protein: 220, carbs: 25, fat: 92, calories: 2200, mealCount: 3 },
        { date: '2026-05-23', protein: 200, carbs: 120, fat: 95, calories: 2400, mealCount: 3 },
        { date: '2026-05-24', protein: 195, carbs: 150, fat: 100, calories: 2350, mealCount: 3 },
      ],
      weightLogs: [
        { date: '2026-05-12', weight: 101.2 },
        { date: '2026-05-13', weight: 101.0 },
        { date: '2026-05-14', weight: 100.8 },
        { date: '2026-05-15', weight: 100.6 },
        { date: '2026-05-16', weight: 100.4 },
        { date: '2026-05-17', weight: 100.2 },
        { date: '2026-05-18', weight: 100.0 },
        { date: '2026-05-19', weight: 99.8 },
        { date: '2026-05-20', weight: 99.7 },
        { date: '2026-05-21', weight: 99.5 },
        { date: '2026-05-22', weight: 99.4 },
        { date: '2026-05-23', weight: 99.2 },
        { date: '2026-05-24', weight: 99.0 },
      ],
      profile: {
        dietStyle: 'keto_flexible',
        activeMacros: { protein: 200, calories: 2200, carbs: 40 },
      },
      weeklyStats: {
        consumed: { calories: 15650 },
        remaining: { calories: 750 },
        weeklyTargets: { calories: 15400 },
        focus: { sevenDayAverageWeight: 99.5 },
        elapsedDays: 7,
      },
    });

    expect(result.dailySeries).toHaveLength(7);
    expect(result.dailySeries[0].carbTargetMax).toBe(50);
    expect(result.dailySeries[5].carbTargetMin).toBe(100);
    expect(result.summary.currentWeight).toBe(99);
    expect(result.summary.sevenDayAverageWeight).toBe(99.5);
    expect(result.summary.proteinAdherencePercentage).toBe(57);
    expect(result.summary.weeklyCalorieAdherencePercentage).toBe(98);
    expect(result.summary.previousWeekChange).toBe(-1.2);
  });

  it('adds waist, workout, hydration, and recovery signals when health data exists', () => {
    const result = buildTrendAnalytics({
      startDate: '2026-05-18',
      endDate: '2026-05-24',
      mealTrends: [
        { date: '2026-05-18', protein: 180, carbs: 30, fat: 80, calories: 2100, mealCount: 3 },
        { date: '2026-05-19', protein: 205, carbs: 35, fat: 90, calories: 2200, mealCount: 3 },
        { date: '2026-05-20', protein: 210, carbs: 40, fat: 85, calories: 2250, mealCount: 3 },
      ],
      weightLogs: [
        { date: '2026-05-18', weight: 100.0 },
        { date: '2026-05-19', weight: 99.8 },
        { date: '2026-05-20', weight: 99.7 },
      ],
      healthMetrics: [
        {
          date: '2026-05-18',
          recordedAt: '2026-05-18T20:00',
          waistMeasurement: 40.0,
          workoutCompleted: true,
          sleepHours: 7.5,
          energyLevel: 4,
          hungerLevel: 3,
          sorenessLevel: 2,
        },
        {
          date: '2026-05-19',
          recordedAt: '2026-05-19T20:00',
          workoutCompleted: false,
          sleepHours: 6,
          energyLevel: 2,
          hungerLevel: 4,
          sorenessLevel: 4,
        },
        {
          date: '2026-05-20',
          recordedAt: '2026-05-20T20:00',
          waistMeasurement: 39.2,
          workoutCompleted: true,
        },
      ],
      beverageEntries: [
        { date: '2026-05-18', recordedAt: '2026-05-18T08:00', amountFlOz: 64, countsTowardHydration: true },
        { date: '2026-05-18', recordedAt: '2026-05-18T18:00', amountFlOz: 56, countsTowardHydration: true },
        { date: '2026-05-19', recordedAt: '2026-05-19T20:00', amountFlOz: 80, countsTowardHydration: true },
      ],
      profile: {
        weight: 100,
        dietStyle: 'keto',
        activeMacros: { protein: 200, calories: 2200, carbs: 40 },
      },
      weeklyStats: {
        consumed: { calories: 6550 },
        remaining: { calories: 8850 },
        weeklyTargets: { calories: 15400 },
        focus: { sevenDayAverageWeight: 99.8 },
        elapsedDays: 3,
      },
    });

    expect(result.dailySeries[0].waistMeasurement).toBe(40);
    expect(result.dailySeries[1].workoutCompletedValue).toBe(0);
    expect(result.dailySeries[0].sevenDayAverageHydration).toBe(120);
    expect(result.dailySeries[1].sevenDayAverageHydration).toBe(100);
    expect(result.summary.waistChange).toBe(-0.8);
    expect(result.summary.workoutCompletionPercentage).toBe(67);
    expect(result.summary.hydrationAdherencePercentage).toBe(0);
    expect(result.summary.hydrationTarget).toBeGreaterThan(0);
    expect(result.summary.weeklyAverageHydration).toBe(100);
  });

  it('keeps trend grouping on the user local date key near UTC midnight', () => {
    const localDate = formatDate('2026-05-26T02:16:00.000Z', { timeZone: 'America/New_York' });
    const result = buildTrendAnalytics({
      startDate: localDate,
      endDate: localDate,
      mealTrends: [
        { date: '2026-05-25', protein: 160, carbs: 30, fat: 90, calories: 1800, mealCount: 3 },
      ],
      weightLogs: [],
      healthMetrics: [],
      beverageEntries: [
        { date: '2026-05-25', recordedAt: '2026-05-25T22:16', amountFlOz: 24, countsTowardHydration: true },
      ],
      profile: {
        weight: 100,
        dietStyle: 'keto',
        activeMacros: { protein: 200, calories: 2200, carbs: 35 },
      },
      weeklyStats: {
        dailyTargets: { calories: 2200 },
        weeklyTargets: { calories: 15400 },
        consumed: { calories: 1800 },
        remaining: { calories: 13600 },
        focus: { sevenDayAverageWeight: null },
        elapsedDays: 1,
      },
    });

    expect(localDate).toBe('2026-05-25');
    expect(result.dailySeries).toHaveLength(1);
    expect(result.dailySeries[0].date).toBe('2026-05-25');
    expect(result.dailySeries[0].hydrationOunces).toBe(24);
  });
});
