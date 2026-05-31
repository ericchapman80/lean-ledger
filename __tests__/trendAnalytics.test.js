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
      .toEqual({ min: 20, max: 50, label: 'Keto Weekday', isFlexible: false, carbLabel: 'Net Carbs' });
    expect(getDietStyleCarbGuidance('keto_flexible', '2026-05-23', 120))
      .toEqual({ min: 100, max: 175, label: 'Flexible Weekend', isFlexible: true, carbLabel: 'Net Carbs' });
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
        { date: '2026-05-18', protein: 180, carbs: 30, fiber: 10, netCarbs: 20, fat: 80, calories: 2100, mealCount: 3 },
        { date: '2026-05-19', protein: 205, carbs: 35, fiber: 5, netCarbs: 30, fat: 90, calories: 2200, mealCount: 3 },
        { date: '2026-05-20', protein: 210, carbs: 40, fiber: 12, netCarbs: 28, fat: 85, calories: 2250, mealCount: 3 },
        { date: '2026-05-21', protein: 190, carbs: 45, fiber: 5, netCarbs: 40, fat: 88, calories: 2150, mealCount: 3 },
        { date: '2026-05-22', protein: 220, carbs: 25, fiber: 5, netCarbs: 20, fat: 92, calories: 2200, mealCount: 3 },
        { date: '2026-05-23', protein: 200, carbs: 120, fiber: 20, netCarbs: 100, fat: 95, calories: 2400, mealCount: 3 },
        { date: '2026-05-24', protein: 195, carbs: 150, fiber: 25, netCarbs: 125, fat: 100, calories: 2350, mealCount: 3 },
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
    expect(result.dailySeries[0].carbs).toBe(20);
    expect(result.dailySeries[0].totalCarbs).toBe(30);
    expect(result.summary.carbLabel).toBe('Net Carbs');
    expect(result.summary.currentWeight).toBe(99);
    expect(result.summary.sevenDayAverageWeight).toBe(99.5);
    expect(result.summary.proteinAdherencePercentage).toBe(57);
    expect(result.summary.weeklyCalorieAdherencePercentage).toBe(98);
    expect(result.summary.previousWeekChange).toBe(-1.2);
  });

  it('keeps moving average calculations in canonical kg for presentation-layer conversion', () => {
    const result = buildTrendAnalytics({
      startDate: '2026-05-18',
      endDate: '2026-05-24',
      mealTrends: [],
      weightLogs: [
        { date: '2026-05-18', weight: 102.4 },
        { date: '2026-05-19', weight: 102.5 },
        { date: '2026-05-20', weight: 102.6 },
        { date: '2026-05-21', weight: 102.7 },
        { date: '2026-05-22', weight: 102.8 },
        { date: '2026-05-23', weight: 102.9 },
        { date: '2026-05-24', weight: 103.0 },
      ],
      profile: {
        weight: 102.7,
        dietStyle: 'balanced',
        activeMacros: { protein: 200, calories: 2200, carbs: 180 },
      },
      weeklyStats: {
        dailyTargets: { calories: 2200 },
        weeklyTargets: { calories: 15400 },
        consumed: { calories: 0 },
        remaining: { calories: 15400 },
        focus: { sevenDayAverageWeight: 102.7 },
        elapsedDays: 7,
      },
    });

    expect(result.dailySeries[6].sevenDayAverageWeight).toBe(102.7);
    expect(result.summary.currentWeight).toBe(103);
    expect(result.summary.sevenDayAverageWeight).toBe(102.7);
  });

  it('adds waist, workout, hydration, and recovery signals when health data exists', () => {
    const result = buildTrendAnalytics({
      startDate: '2026-05-18',
      endDate: '2026-05-24',
      mealTrends: [
        { date: '2026-05-18', protein: 180, carbs: 30, fiber: 6, netCarbs: 24, fat: 80, calories: 2100, mealCount: 3 },
        { date: '2026-05-19', protein: 205, carbs: 35, fiber: 8, netCarbs: 27, fat: 90, calories: 2200, mealCount: 3 },
        { date: '2026-05-20', protein: 210, carbs: 40, fiber: 10, netCarbs: 30, fat: 85, calories: 2250, mealCount: 3 },
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
        { date: '2026-05-25', protein: 160, carbs: 30, fiber: 8, netCarbs: 22, fat: 90, calories: 1800, mealCount: 3 },
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
    expect(result.dailySeries[0].carbs).toBe(22);
  });

  it('keeps balanced trends on total carbs instead of net carbs', () => {
    const result = buildTrendAnalytics({
      startDate: '2026-05-25',
      endDate: '2026-05-25',
      mealTrends: [
        { date: '2026-05-25', protein: 160, carbs: 30, fiber: 8, netCarbs: 22, fat: 90, calories: 1800, mealCount: 3 },
      ],
      weightLogs: [],
      profile: {
        weight: 100,
        dietStyle: 'balanced',
        activeMacros: { protein: 200, calories: 2200, carbs: 180 },
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

    expect(result.summary.carbLabel).toBe('Carbs');
    expect(result.dailySeries[0].carbs).toBe(30);
  });

  it('builds meal behavior analytics from meal-type breakdowns', () => {
    const result = buildTrendAnalytics({
      startDate: '2026-05-25',
      endDate: '2026-05-28',
      mealTrends: [
        {
          date: '2026-05-25',
          protein: 150,
          carbs: 110,
          fiber: 12,
          netCarbs: 98,
          fat: 60,
          calories: 1900,
          mealCount: 4,
          mealBreakdown: [
            { mealType: 'breakfast', protein: 40, calories: 450, count: 2, loggedAt: ['2026-05-25T08:00:00.000Z'] },
            { mealType: 'snack', protein: 20, calories: 250, count: 1, loggedAt: ['2026-05-25T14:00:00.000Z'] },
            { mealType: 'dinner', protein: 45, calories: 600, count: 1, loggedAt: ['2026-05-25T18:30:00.000Z'] },
          ],
        },
        {
          date: '2026-05-26',
          protein: 160,
          carbs: 100,
          fiber: 10,
          netCarbs: 90,
          fat: 65,
          calories: 2000,
          mealCount: 4,
          mealBreakdown: [
            { mealType: 'breakfast', protein: 30, calories: 420, count: 1, loggedAt: ['2026-05-26T08:20:00.000Z'] },
            { mealType: 'lunch', protein: 42, calories: 500, count: 1, loggedAt: ['2026-05-26T12:00:00.000Z'] },
            { mealType: 'dinner', protein: 35, calories: 650, count: 2, loggedAt: ['2026-05-26T18:50:00.000Z'] },
          ],
        },
        {
          date: '2026-05-27',
          protein: 120,
          carbs: 125,
          fiber: 8,
          netCarbs: 117,
          fat: 55,
          calories: 1850,
          mealCount: 3,
          mealBreakdown: [
            { mealType: 'snack', protein: 18, calories: 180, count: 1, loggedAt: ['2026-05-27T09:00:00.000Z'] },
            { mealType: 'dinner', protein: 34, calories: 700, count: 2, loggedAt: ['2026-05-27T19:10:00.000Z'] },
          ],
        },
        {
          date: '2026-05-28',
          protein: 170,
          carbs: 95,
          fiber: 10,
          netCarbs: 85,
          fat: 70,
          calories: 1950,
          mealCount: 3,
          mealBreakdown: [
            { mealType: 'breakfast', protein: 50, calories: 500, count: 1, loggedAt: ['2026-05-28T08:10:00.000Z'] },
            { mealType: 'dinner', protein: 38, calories: 550, count: 2, loggedAt: ['2026-05-28T18:40:00.000Z'] },
          ],
        },
      ],
      weightLogs: [],
      profile: {
        weight: 100,
        dietStyle: 'balanced',
        activeMacros: { protein: 200, calories: 2200, carbs: 180 },
      },
      weeklyStats: {
        dailyTargets: { calories: 2200 },
        weeklyTargets: { calories: 15400 },
        consumed: { calories: 7700 },
        remaining: { calories: 7700 },
        focus: { sevenDayAverageWeight: null },
        elapsedDays: 4,
      },
    });

    expect(result.summary.mealBehavior.averageBreakfastProtein).toBe(40);
    expect(result.summary.mealBehavior.snackDays).toBe(2);
    expect(result.summary.mealBehavior.snackFrequencyPercentage).toBe(50);
    expect(result.summary.mealBehavior.averageDinnerCalories).toBe(625);
    expect(result.summary.mealBehavior.dinnerCaloriesChange).toBe(0);
    expect(result.summary.mealBehavior.averageFirstMealVarianceMinutes).toBe(19);
    expect(result.summary.mealBehavior.mealTimingConsistencyLabel).toBe('Tight timing');
    expect(result.summary.mealBehavior.highProteinMealThreshold).toBe(40);
    expect(result.summary.mealBehavior.currentHighProteinMealStreak).toBe(1);
    expect(result.summary.mealBehavior.longestHighProteinMealStreak).toBe(2);
    expect(result.dailySeries[0].breakfastProtein).toBe(40);
    expect(result.dailySeries[1].dinnerCalories).toBe(650);
    expect(result.dailySeries[2].hadSnack).toBe(true);
  });

  it('builds beverage behavior analytics from weighted hydration, caffeine, and timing', () => {
    const result = buildTrendAnalytics({
      startDate: '2026-05-25',
      endDate: '2026-05-28',
      mealTrends: [],
      weightLogs: [],
      beverageEntries: [
        {
          date: '2026-05-25',
          recordedAt: '2026-05-25T09:00',
          amountFlOz: 40,
          beverageType: 'water',
          countsTowardHydration: true,
          caffeineMg: 0,
        },
        {
          date: '2026-05-25',
          recordedAt: '2026-05-25T18:30',
          amountFlOz: 16,
          beverageType: 'black_coffee',
          countsTowardHydration: true,
          caffeineMg: 120,
        },
        {
          date: '2026-05-25',
          recordedAt: '2026-05-25T20:00',
          amountFlOz: 12,
          beverageType: 'diet_drink',
          countsTowardHydration: true,
          caffeineMg: 40,
        },
        {
          date: '2026-05-26',
          recordedAt: '2026-05-26T10:00',
          amountFlOz: 32,
          beverageType: 'electrolyte_drink',
          countsTowardHydration: true,
          caffeineMg: 0,
        },
        {
          date: '2026-05-26',
          recordedAt: '2026-05-26T19:00',
          amountFlOz: 12,
          beverageType: 'protein_shake',
          countsTowardHydration: false,
          caffeineMg: 0,
        },
        {
          date: '2026-05-27',
          recordedAt: '2026-05-27T17:30',
          amountFlOz: 24,
          beverageType: 'unsweet_tea',
          countsTowardHydration: true,
          caffeineMg: 30,
        },
      ],
      profile: {
        weight: 45,
        dietStyle: 'balanced',
        activeMacros: { protein: 180, calories: 2200, carbs: 180 },
      },
      weeklyStats: {
        dailyTargets: { calories: 2200 },
        weeklyTargets: { calories: 15400 },
        consumed: { calories: 0 },
        remaining: { calories: 15400 },
        focus: { sevenDayAverageWeight: null },
        elapsedDays: 4,
      },
    });

    expect(result.dailySeries[0].hydrationOunces).toBe(66);
    expect(result.dailySeries[0].totalFluidsOunces).toBe(68);
    expect(result.dailySeries[0].caffeineMg).toBe(160);
    expect(result.dailySeries[0].lateDayHydrationOunces).toBe(26);
    expect(result.dailySeries[1].beverageCount).toBe(2);
    expect(result.summary.hydrationAdherencePercentage).toBe(33);
    expect(result.summary.beverageBehavior.loggedDays).toBe(3);
    expect(result.summary.beverageBehavior.averageDailyHydration).toBe(41);
    expect(result.summary.beverageBehavior.hydrationTargetHitRate).toBe(33);
    expect(result.summary.beverageBehavior.averageDailyCaffeineMg).toBe(63);
    expect(result.summary.beverageBehavior.lateDayHydrationPercentage).toBe(41);
    expect(result.summary.beverageBehavior.primaryBeverageLabel).toBe('Water');
    expect(result.summary.beverageBehavior.primaryBeverageSharePercentage).toBe(29);
    expect(result.summary.beverageBehavior.beverageMix[0]).toMatchObject({
      beverageType: 'water',
      label: 'Water',
      totalFluidsOunces: 40,
      hydrationOunces: 40,
      sharePercentage: 29,
    });
  });
});
