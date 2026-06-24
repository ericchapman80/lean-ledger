'use client';

import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { beverageApi, bodyCompositionGoalsApi, dailyHabitsApi, habitDefinitionsApi, healthMetricsApi, profileApi, statsApi, weightApi } from '@/lib/api';
import {
  formatHealthMetricDisplayUnitValue,
  getHealthMetricFieldMeta,
  HEALTH_METRIC_FIELDS,
} from '@/lib/healthMetrics';
import { mergeDailyWinDefinitions } from '@/lib/dailyWins';
import { buildTrendAnalytics } from '@/lib/trendAnalytics';
import { getDateDaysBefore, getTodayDate } from '@/lib/utils/dateUtils';
import { buildAdvancedMetricGroups, buildTrendChartData } from '@/lib/trendDisplay';
import { formatDisplayWeightValue, formatWeight, formatWeightChange, getWeightUnit } from '@/lib/utils/unitUtils';
import { formatBodyFatTarget, formatGoalDate, formatGoalMass, formatGoalPercent, getBodyCompositionStatusMeta, getGoalOutcomeLabel, getGoalProgressBarMeta } from '@/lib/bodyCompositionGoalDisplay';
import { formatWaterFromFlOz, getPreferredWaterUnit } from '@/lib/water';
import Loading from '@/components/Loading';
import ErrorMessage from '@/components/ErrorMessage';
import GoalProgressBar from '@/components/GoalProgressBar';

function EmptyTrendCard({ title, body }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
      <h2 style={{ marginBottom: '10px' }}>{title}</h2>
      <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{body}</p>
    </div>
  );
}

function SummaryCard({ label, value, helper, accent }) {
  return (
    <div className="card">
      <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{label}</h3>
      <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: accent || 'inherit' }}>{value}</p>
      {helper && (
        <p style={{ marginTop: '6px', color: 'var(--text-secondary)', fontSize: '14px' }}>{helper}</p>
      )}
    </div>
  );
}

function formatMinutesFromMidnight(minutes) {
  if (!Number.isFinite(minutes)) return 'Not enough data';
  const normalizedMinutes = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalizedMinutes / 60);
  const mins = normalizedMinutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(mins).padStart(2, '0')} ${period}`;
}

function getAxisIdForAdvancedMetric(group, fieldKey) {
  if (!group.axisGroups) return 'left';
  return group.axisGroups.right.includes(fieldKey) ? 'right' : 'left';
}

export default function Trends() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState(14);
  const [analytics, setAnalytics] = useState(null);
  const [profile, setProfile] = useState(null);
  const [customHabits, setCustomHabits] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState(null);
  const [bodyCompositionGoals, setBodyCompositionGoals] = useState({ activeGoal: null, history: [] });

  const fetchTrends = async () => {
    try {
      setLoading(true);
      setError(null);

      const endDate = getTodayDate();
      const startDate = getDateDaysBefore(endDate, period - 1);
      const weightStartDate = getDateDaysBefore(startDate, 6);

      const [profileData, weeklyStatsData, mealTrendData, weightData, healthMetricData, beverageData, customHabitData, dailyHabitLogData, goalData] = await Promise.all([
        profileApi.getProfile(),
        statsApi.getWeeklyStats(endDate),
        statsApi.getTrends(startDate, endDate),
        weightApi.getWeightLogs({ startDate: weightStartDate, endDate }),
        healthMetricsApi.getHealthMetrics({ startDate, endDate }),
        beverageApi.getBeverages({ startDate, endDate }),
        habitDefinitionsApi.getHabitDefinitions(),
        dailyHabitsApi.getDailyHabitLogs({ startDate, endDate }),
        bodyCompositionGoalsApi.getGoals(),
      ]);

      setProfile(profileData);
      setCustomHabits(customHabitData);
      setWeeklyStats(weeklyStatsData);
      setBodyCompositionGoals({
        activeGoal: goalData?.activeGoal || null,
        history: goalData?.history || [],
      });
      setAnalytics(buildTrendAnalytics({
        startDate,
        endDate,
        mealTrends: mealTrendData,
        weightLogs: weightData,
        healthMetrics: healthMetricData,
        beverageEntries: beverageData,
        dailyHabitLogs: dailyHabitLogData,
        customHabits: customHabitData,
        profile: profileData,
        weeklyStats: weeklyStatsData,
      }));
    } catch (err) {
      setError(err.message || 'Failed to load trends');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrends(); }, [period]);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} onRetry={fetchTrends} />;
  if (!analytics || !profile || !weeklyStats) return <ErrorMessage error="No data available" />;

  const chartData = buildTrendChartData(analytics.dailySeries, profile.units);

  const calorieBudgetChart = [
    {
      label: 'Week',
      consumed: analytics.summary.weeklyCaloriesConsumed,
      remaining: analytics.summary.weeklyCaloriesRemaining,
    },
  ];

  const consistencyTrendLine = chartData.map((entry) => ({
    ...entry,
    weeklyAverageConsistency: analytics.summary.weeklyAverageConsistency,
  }));
  const advancedMetricGroups = buildAdvancedMetricGroups(chartData);
  const activeBodyGoal = bodyCompositionGoals.activeGoal;
  const bodyGoalStatus = getBodyCompositionStatusMeta(activeBodyGoal?.status?.overall);
  const trendWeightMeta = getGoalProgressBarMeta(activeBodyGoal?.progress?.weightProgressPercent, activeBodyGoal?.status?.overall);
  const trendFatMeta = getGoalProgressBarMeta(activeBodyGoal?.progress?.bodyFatProgressPercent, activeBodyGoal?.status?.overall);
  const trendLeanMeta = getGoalProgressBarMeta(activeBodyGoal?.progress?.leanMassRetentionScore, activeBodyGoal?.status?.overall);
  const trendMuscleMeta = getGoalProgressBarMeta(activeBodyGoal?.progress?.musclePreservationScore, activeBodyGoal?.status?.overall);
  const preferredWaterUnit = getPreferredWaterUnit(profile.units);
  const weightUnit = getWeightUnit(profile.units);
  const carbLabel = analytics.summary.carbLabel || 'Carbs';
  const mealBehavior = analytics.summary.mealBehavior || {};
  const beverageBehavior = analytics.summary.beverageBehavior || {};
  const recoveryBehavior = analytics.summary.recoveryBehavior || {};
  const dailyWinsBehavior = analytics.summary.dailyWinsBehavior || {};
  const dailyWinsChallengeBehavior = analytics.summary.dailyWinsChallengeBehavior || null;
  const activeDailyWins = mergeDailyWinDefinitions(profile.dailyWinsActiveKeys, customHabits);
  const hasWaistData = chartData.some((entry) => entry.waistMeasurement != null);
  const hasWorkoutData = chartData.some((entry) => entry.workoutCompleted != null);
  const hasHydrationData = chartData.some((entry) => entry.hydrationOunces != null);
  const hasMealBehaviorData = chartData.some((entry) => (
    entry.breakfastProtein != null
    || entry.dinnerCalories != null
    || entry.hadSnack
    || entry.firstMealLoggedMinutes != null
  ));
  const hasBeverageBehaviorData = chartData.some((entry) => (
    Number(entry.totalFluidsOunces || 0) > 0
    || Number(entry.caffeineMg || 0) > 0
    || Number(entry.lateDayHydrationOunces || 0) > 0
  ));
  const hasRecoveryData = chartData.some((entry) => (
    entry.sleepHours != null
    || entry.energyLevel != null
    || entry.hungerLevel != null
    || entry.sorenessLevel != null
  ));
  const hasRecoveryBehaviorData = (
    recoveryBehavior.loggedWorkoutDays > 0
    || recoveryBehavior.averageSleepHours != null
    || recoveryBehavior.recoveryReadyLoggedDays > 0
  );
  const hasDailyWinsBehaviorData = (
    dailyWinsBehavior.averageCompletedWins != null
    || Object.values(dailyWinsBehavior.habitCompletionPercentages || {}).some((value) => value != null)
    || dailyWinsChallengeBehavior != null
  );
  const formatAdvancedMetricTooltip = (value, _name, item) => (
    formatHealthMetricDisplayUnitValue(item?.dataKey, value, profile.units)
  );

  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '40px' }}>
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: 0, marginBottom: '6px' }}>Lean Recomp Trends</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Prioritize weekly signals over noisy day-to-day swings.
          </p>
        </div>
        <div className="page-header-actions">
          {[7, 14, 30].map((days) => (
            <button
              key={days}
              onClick={() => setPeriod(days)}
              className={`btn ${period === days ? 'btn-primary' : 'btn-outline'}`}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '8px' }}>Core Trends</h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          Keep the focus on weight trend, protein consistency, calorie adherence, and weekly budget. Add more only if it helps.
        </p>
      </div>

      <div className="grid grid-4" style={{ marginBottom: '32px' }}>
        <SummaryCard
          label="Current Weight"
          value={analytics.summary.currentWeight != null ? formatWeight(analytics.summary.currentWeight, profile.units) : 'Add weight logs'}
        />
        <SummaryCard
          label="7-Day Average"
          value={analytics.summary.sevenDayAverageWeight != null ? formatWeight(analytics.summary.sevenDayAverageWeight, profile.units) : 'Not enough data'}
          helper={analytics.summary.previousWeekChange != null
            ? `${formatWeightChange(analytics.summary.previousWeekChange, profile.units)} vs previous week`
            : 'Need at least two weeks of weight logs for comparison.'}
        />
        <SummaryCard
          label="Protein Adherence"
          value={`${analytics.summary.proteinAdherencePercentage}%`}
          accent="#e74c3c"
        />
        <SummaryCard
          label="Weekly Calorie Adherence"
          value={`${analytics.summary.weeklyCalorieAdherencePercentage}%`}
          accent="var(--primary-color)"
        />
      </div>

      {chartData.some((entry) => entry.weight != null || entry.sevenDayAverageWeight != null) ? (
        <div className="card chart-card" style={{ marginBottom: '32px' }}>
          <h2 style={{ marginBottom: '8px' }}>7-Day Average Weight Trend</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Scale Weight is shown lightly. Use the 7-Day Average as the main signal.
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="displayDate" minTickGap={24} />
              <YAxis
                tickFormatter={(value) => formatDisplayWeightValue(value, profile.units)}
                label={{ value: weightUnit, angle: -90, position: 'insideLeft' }}
              />
              <Tooltip formatter={(value) => formatDisplayWeightValue(value, profile.units)} />
              <Legend />
              <Bar dataKey="weight" fill="rgba(33, 150, 243, 0.25)" name="Scale Weight" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="sevenDayAverageWeight" stroke="#1f6feb" strokeWidth={3} dot={false} name="7-Day Average" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ marginBottom: '32px' }}>
          <EmptyTrendCard title="7-Day Average Weight Trend" body="Log weight across several days to smooth the trend and compare against the previous week." />
        </div>
      )}

      <div className="grid grid-2" style={{ marginBottom: '32px' }}>
        <div className="card chart-card">
          <h2 style={{ marginBottom: '8px' }}>Weekly Calorie Budget</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Flexible weekends still need to fit the weekly calorie budget.
          </p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={calorieBudgetChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="consumed" stackId="budget" fill="var(--primary-color)" name="Calories Consumed So Far" radius={[4, 4, 0, 0]} />
              <Bar dataKey="remaining" stackId="budget" fill="rgba(76, 175, 80, 0.2)" name="Calories Remaining" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gap: '10px', marginTop: '16px' }}>
            <div className="summary-row">
              <span style={{ minWidth: 0 }}>Weekly Calorie Target</span>
              <strong style={{ flexShrink: 0 }}>{analytics.summary.weeklyCalorieTarget} kcal</strong>
            </div>
            <div className="summary-row">
              <span style={{ minWidth: 0 }}>Daily Average Needed to Stay on Target</span>
              <strong style={{ flexShrink: 0 }}>{analytics.summary.dailyAverageNeeded} kcal</strong>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '8px' }}>Body Recomposition Snapshot</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Track weight trend, protein consistency, calorie alignment, and the core recomposition signals you actually use.
          </p>
          <div style={{ display: 'grid', gap: '14px' }}>
            <div className="summary-row">
              <span style={{ minWidth: 0 }}>Current Weight</span>
              <strong>{analytics.summary.currentWeight != null ? formatWeight(analytics.summary.currentWeight, profile.units) : 'Add weight logs'}</strong>
            </div>
            <div className="summary-row">
              <span>7-Day Average Weight</span>
              <strong>{analytics.summary.sevenDayAverageWeight != null ? formatWeight(analytics.summary.sevenDayAverageWeight, profile.units) : 'Not enough data'}</strong>
            </div>
            <div className="summary-row">
              <span>Protein Adherence</span>
              <strong>{analytics.summary.proteinAdherencePercentage}%</strong>
            </div>
            <div className="summary-row">
              <span>Weekly Calorie Adherence</span>
              <strong>{analytics.summary.weeklyCalorieAdherencePercentage}%</strong>
            </div>
            {analytics.summary.waistChange != null && (
              <div className="summary-row">
                <span>Waist Change</span>
                <strong>{analytics.summary.waistChange > 0 ? '+' : ''}{analytics.summary.waistChange} in</strong>
              </div>
            )}
            {analytics.summary.workoutCompletionPercentage != null && (
              <div className="summary-row">
                <span>Workout Completion</span>
                <strong>{analytics.summary.workoutCompletionPercentage}%</strong>
              </div>
            )}
            {analytics.summary.hydrationAdherencePercentage != null && (
              <div className="summary-row">
                <span>Hydration Adherence</span>
                <strong>{analytics.summary.hydrationAdherencePercentage}%</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeBodyGoal ? (
        <div className="card" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', marginBottom: '18px' }}>
            <div>
              <h2 style={{ marginBottom: '8px' }}>Body Composition Goal Progress</h2>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                {activeBodyGoal.name} • Target date {formatGoalDate(activeBodyGoal.targetDate)}
              </p>
            </div>
            <div style={{
              borderRadius: '999px',
              padding: '6px 10px',
              border: `1px solid ${bodyGoalStatus.border}`,
              background: bodyGoalStatus.background,
              color: bodyGoalStatus.color,
              fontSize: '12px',
              fontWeight: 600,
            }}>
              {bodyGoalStatus.label}
            </div>
          </div>

          <div className="grid grid-2" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <span>Weight goal</span>
                <strong>{formatGoalMass(activeBodyGoal.current?.weight, profile.units)} → {formatGoalMass(activeBodyGoal.goalWeight, profile.units)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <span>Body fat goal</span>
                <strong>{formatGoalPercent(activeBodyGoal.current?.bodyFatPercent)} → {formatBodyFatTarget(activeBodyGoal)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <span>Lean mass floor</span>
                <strong>{formatGoalMass(activeBodyGoal.current?.leanMass, profile.units)} current • floor {formatGoalMass(activeBodyGoal.minimumLeanMass, profile.units)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <span>Muscle mass floor</span>
                <strong>{formatGoalMass(activeBodyGoal.current?.muscleMass, profile.units)} current • floor {formatGoalMass(activeBodyGoal.minimumMuscleMass, profile.units)}</strong>
              </div>
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <span>Remaining weight</span>
                <strong>{activeBodyGoal.progress?.remainingWeightToGoal != null ? formatGoalMass(activeBodyGoal.progress.remainingWeightToGoal, profile.units) : 'Needs current weight data'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <span>Estimated fat remaining</span>
                <strong>{activeBodyGoal.progress?.remainingFatToLose != null ? formatGoalMass(activeBodyGoal.progress.remainingFatToLose, profile.units) : 'Needs body fat data'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <span>Lean mass change</span>
                <strong>{activeBodyGoal.progress?.leanMassChangeSinceStart != null ? `${activeBodyGoal.progress.leanMassChangeSinceStart > 0 ? '+' : ''}${formatGoalMass(activeBodyGoal.progress.leanMassChangeSinceStart, profile.units)}` : 'Needs body composition data'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <span>Muscle mass change</span>
                <strong>{activeBodyGoal.progress?.muscleMassChangeSinceStart != null ? `${activeBodyGoal.progress.muscleMassChangeSinceStart > 0 ? '+' : ''}${formatGoalMass(activeBodyGoal.progress.muscleMassChangeSinceStart, profile.units)}` : 'Needs body composition data'}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '8px', marginBottom: bodyCompositionGoals.history.length > 0 ? '20px' : 0 }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
              {activeBodyGoal.status?.summary}
            </p>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
              Baseline: {formatGoalMass(activeBodyGoal.baseline?.weight, profile.units)} on {formatGoalDate(activeBodyGoal.baseline?.recordedAt?.slice(0, 10))}.
              {activeBodyGoal.estimatedCompletionDate
                ? ` Estimated based on recent trend: ${formatGoalDate(activeBodyGoal.estimatedCompletionDate)}.`
                : ' Estimated completion appears after at least 3 entries across 14 days.'}
            </p>
            {profile.ageGroup === 'teen' ? (
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
                Teen profiles should treat this as a conservative body-composition guide, not an aggressive cut plan.
              </p>
            ) : null}
            {activeBodyGoal.status?.warnings?.length > 0 ? activeBodyGoal.status.warnings.map((warning) => (
              <p key={warning} style={{ margin: 0, color: 'var(--warning-color)', fontSize: '13px' }}>
                {warning}
              </p>
            )) : null}
          </div>

          <div className="grid grid-2" style={{ marginBottom: bodyCompositionGoals.history.length > 0 ? '20px' : 0 }}>
            <GoalProgressBar
              label="Weight progress"
              percent={trendWeightMeta.percent}
              color={trendWeightMeta.color}
              helper="Baseline to target weight progress"
            />
            <GoalProgressBar
              label="Body fat progress"
              percent={trendFatMeta.percent}
              color={trendFatMeta.color}
              helper="Baseline to body-fat target progress"
            />
            <GoalProgressBar
              label="Lean mass retention"
              percent={trendLeanMeta.percent}
              color={trendLeanMeta.color}
              helper="Retention vs. phase start"
            />
            <GoalProgressBar
              label="Muscle preservation"
              percent={trendMuscleMeta.percent}
              color={trendMuscleMeta.color}
              helper="Muscle mass held vs. phase start"
            />
          </div>

          {bodyCompositionGoals.history.length > 0 ? (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '18px' }}>
              <h3 style={{ margin: '0 0 12px' }}>Phase History</h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                {bodyCompositionGoals.history.map((goal) => (
                  <div key={goal.id} style={{ padding: '12px 14px', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <p style={{ margin: '0 0 4px', fontWeight: 600 }}>{goal.name}</p>
                      {getGoalOutcomeLabel(goal) ? (
                        <span style={{
                          borderRadius: '999px',
                          padding: '4px 8px',
                          border: '1px solid var(--border-color)',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                        }}>
                          {getGoalOutcomeLabel(goal)}
                        </span>
                      ) : null}
                    </div>
                    <p style={{ margin: '0 0 4px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {formatGoalDate(goal.startedAt?.slice(0, 10))} → {formatGoalDate((goal.completedAt || goal.archivedAt)?.slice(0, 10))}
                    </p>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
                      Baseline {formatGoalMass(goal.baseline?.weight, profile.units)} • Completion {formatGoalMass(goal.completionWeight, profile.units)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {hasMealBehaviorData && (
        <>
          <div className="card" style={{ marginBottom: '24px' }}>
            <h2 style={{ marginBottom: '8px' }}>Meal Patterns</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Spot repeatable meal behaviors: breakfast protein, snack frequency, dinner size, and how consistent your first meal timing stays.
            </p>
          </div>

          <div className="grid grid-4" style={{ marginBottom: '32px' }}>
            <SummaryCard
              label="Avg Breakfast Protein"
              value={mealBehavior.averageBreakfastProtein != null ? `${mealBehavior.averageBreakfastProtein}g` : 'No breakfasts yet'}
              helper={mealBehavior.breakfastDays
                ? `${mealBehavior.breakfastDays} breakfast days in this window`
                : 'Log breakfast on multiple days to establish a pattern.'}
              accent="#c0392b"
            />
            <SummaryCard
              label="Snack Frequency"
              value={`${mealBehavior.snackDays || 0} days`}
              helper={`${mealBehavior.snackFrequencyPercentage || 0}% of tracked days included a snack`}
              accent="#e67e22"
            />
            <SummaryCard
              label="Avg Dinner Calories"
              value={mealBehavior.averageDinnerCalories != null ? `${mealBehavior.averageDinnerCalories} kcal` : 'No dinners yet'}
              helper={mealBehavior.dinnerCaloriesChange == null
                ? 'Need dinner logs across the full period to compare direction.'
                : mealBehavior.dinnerCaloriesChange === 0
                  ? 'Dinner calories stayed steady across the window.'
                  : `${mealBehavior.dinnerCaloriesChange > 0 ? '+' : ''}${mealBehavior.dinnerCaloriesChange} kcal vs the first half`}
              accent="var(--primary-color)"
            />
            <SummaryCard
              label="First Meal Timing"
              value={mealBehavior.averageFirstMealVarianceMinutes != null
                ? `±${mealBehavior.averageFirstMealVarianceMinutes} min`
                : 'Not enough data'}
              helper={mealBehavior.averageFirstMealMinutes != null
                ? `${mealBehavior.mealTimingConsistencyLabel} around ${formatMinutesFromMidnight(mealBehavior.averageFirstMealMinutes)}`
                : 'Log meals on multiple days to estimate timing consistency.'}
              accent="#16a085"
            />
            <SummaryCard
              label="High-Protein Streak"
              value={`${mealBehavior.currentHighProteinMealStreak || 0} days`}
              helper={mealBehavior.highProteinMealThreshold
                ? `Longest streak: ${mealBehavior.longestHighProteinMealStreak || 0} days at ${mealBehavior.highProteinMealThreshold}g+ in one meal`
                : 'Track meals consistently to establish a streak.'}
              accent="#8e44ad"
            />
          </div>

          {chartData.some((entry) => entry.breakfastProtein != null || entry.dinnerCalories != null) && (
            <div className="grid grid-2" style={{ marginBottom: '32px' }}>
              <div className="card">
                <h2 style={{ marginBottom: '8px' }}>Breakfast Protein Trend</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Breakfast protein is a strong signal for how anchored your day starts.
                </p>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="displayDate" minTickGap={24} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="breakfastProtein" stroke="#c0392b" strokeWidth={3} dot={{ r: 3 }} name="Breakfast Protein" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <h2 style={{ marginBottom: '8px' }}>Dinner Calories Trend</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Watch whether dinner is creeping up, staying steady, or tightening up over time.
                </p>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="displayDate" minTickGap={24} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="dinnerCalories" stroke="#1f6feb" strokeWidth={3} dot={{ r: 3 }} name="Dinner Calories" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      {hasWaistData && (
        <div className="card" style={{ marginBottom: '32px' }}>
          <h2 style={{ marginBottom: '8px' }}>Waist Trend</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Waist is a high-signal Lean Recomp metric. Measure under consistent conditions and watch the long trend.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="displayDate" minTickGap={24} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="waistMeasurement" stroke="#16a085" strokeWidth={3} dot={{ r: 3 }} name="Waist" />
            </LineChart>
          </ResponsiveContainer>
          <p style={{ marginTop: '14px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            {analytics.summary.waistChange != null
              ? analytics.summary.waistChange < 0
                ? `${Math.abs(analytics.summary.waistChange)} inches lost over this period.`
                : `${analytics.summary.waistChange} inches added over this period.`
              : 'Log waist at least twice to calculate a change.'}
          </p>
        </div>
      )}

      {chartData.some((entry) => entry.protein > 0) ? (
        <div className="card" style={{ marginBottom: '32px' }}>
          <h2 style={{ marginBottom: '8px' }}>Protein Consistency</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Daily Protein vs Protein Target. Days below target are highlighted.
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="displayDate" minTickGap={24} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="protein" name="Protein" radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.date} fill={entry.proteinBelowTarget ? '#f39c12' : '#e74c3c'} />
                ))}
              </Bar>
              <Line type="monotone" dataKey="proteinTarget" stroke="#8e44ad" strokeWidth={2} dot={false} name="Protein Target" />
            </ComposedChart>
          </ResponsiveContainer>
          <p style={{ marginTop: '14px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Weekly average protein: {analytics.summary.weeklyProteinAverage}g
          </p>
        </div>
      ) : (
        <div style={{ marginBottom: '32px' }}>
          <EmptyTrendCard title="Protein Consistency" body="Log meals consistently to compare daily protein intake against your target." />
        </div>
      )}

      {chartData.some((entry) => entry.carbs > 0) ? (
        <div className="card" style={{ marginBottom: '32px' }}>
          <h2 style={{ marginBottom: '8px' }}>{carbLabel} Trend</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            {analytics.summary.usesNetCarbs
              ? 'Net carbs are calculated as total carbs minus fiber and sugar alcohols.'
              : 'Balanced mode tracks total carbs directly. Fiber and net carbs remain available as supporting detail.'}
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="displayDate" minTickGap={24} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="carbs" name={carbLabel} radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.date}
                    fill={entry.carbWithinTarget
                      ? (entry.isFlexibleDay ? '#f39c12' : '#3498db')
                      : '#f44336'}
                  />
                ))}
              </Bar>
              <Line type="monotone" dataKey="carbTargetMax" stroke="#2c3e50" strokeWidth={2} dot={false} name={`${carbLabel} Target Max`} />
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gap: '8px', marginTop: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            <p style={{ margin: 0 }}>Blue bars: keto-style days in range.</p>
            <p style={{ margin: 0 }}>Amber bars: flexible weekend days in range.</p>
            <p style={{ margin: 0 }}>Red bars: {carbLabel.toLowerCase()} landed outside the selected diet style target.</p>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '32px' }}>
          <EmptyTrendCard title={`${carbLabel} Trend`} body={`Log meals to compare daily ${carbLabel.toLowerCase()} against your selected diet style target.`} />
        </div>
      )}

      {hasHydrationData && (
        <div className="card" style={{ marginBottom: '32px' }}>
          <h2 style={{ marginBottom: '8px' }}>Hydration Trend</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Daily hydration stays visible as a core behavior when you actively log beverages.
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="displayDate" minTickGap={24} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="hydrationOunces" fill="#3498db" name="Hydration" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="hydrationTarget" stroke="#1f2d3d" strokeWidth={2} dot={false} name="Hydration Target" />
              <Line type="monotone" dataKey="sevenDayAverageHydration" stroke="#16a085" strokeWidth={3} dot={false} name="7-Day Average Hydration" />
            </ComposedChart>
          </ResponsiveContainer>
          <p style={{ marginTop: '14px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Weekly average hydration: {analytics.summary.weeklyAverageHydration != null
              ? formatWaterFromFlOz(analytics.summary.weeklyAverageHydration, preferredWaterUnit)
              : 'Not enough data'}.
            {' '}Target: {formatWaterFromFlOz(analytics.summary.hydrationTarget, preferredWaterUnit)}.
            {' '}Weekly hydration adherence: {analytics.summary.hydrationAdherencePercentage ?? 0}%.
          </p>
        </div>
      )}

      {hasBeverageBehaviorData && (
        <>
          <div className="card" style={{ marginBottom: '24px' }}>
            <h2 style={{ marginBottom: '8px' }}>Beverage Patterns</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Hydration stays weighted by beverage type, while caffeine, beverage mix, and late-day drinking patterns help explain how those fluids are showing up.
            </p>
          </div>

          <div className="grid grid-4" style={{ marginBottom: '32px' }}>
            <SummaryCard
              label="Avg Daily Hydration"
              value={beverageBehavior.averageDailyHydration != null
                ? formatWaterFromFlOz(beverageBehavior.averageDailyHydration, preferredWaterUnit)
                : 'No beverage logs'}
              helper={beverageBehavior.loggedDays
                ? `${beverageBehavior.loggedDays} beverage days in this window`
                : 'Log beverages across multiple days to establish a pattern.'}
              accent="#3498db"
            />
            <SummaryCard
              label="Hydration Hit Rate"
              value={beverageBehavior.hydrationTargetHitRate != null
                ? `${beverageBehavior.hydrationTargetHitRate}%`
                : 'No beverage logs'}
              helper="Percentage of beverage days that reached the hydration target"
              accent="#16a085"
            />
            <SummaryCard
              label="Primary Beverage"
              value={beverageBehavior.primaryBeverageLabel || 'No beverage logs'}
              helper={beverageBehavior.primaryBeverageSharePercentage != null
                ? `${beverageBehavior.primaryBeverageSharePercentage}% of logged fluids`
                : 'No beverage mix yet'}
              accent="#8e44ad"
            />
            <SummaryCard
              label="Avg Daily Caffeine"
              value={beverageBehavior.averageDailyCaffeineMg != null
                ? `${beverageBehavior.averageDailyCaffeineMg} mg`
                : 'No beverage logs'}
              helper={beverageBehavior.caffeineDays
                ? `${beverageBehavior.caffeineDays} caffeinated days in this window`
                : 'No caffeine recorded in this window'}
              accent="#e67e22"
            />
            <SummaryCard
              label="Late-Day Hydration"
              value={beverageBehavior.averageLateDayHydration != null
                ? formatWaterFromFlOz(beverageBehavior.averageLateDayHydration, preferredWaterUnit)
                : 'No beverage logs'}
              helper={beverageBehavior.loggedDays
                ? `${beverageBehavior.lateDayHydrationPercentage}% of hydration landed after ${formatMinutesFromMidnight(beverageBehavior.lateDayCutoffMinutes)}`
                : 'No late-day hydration pattern yet'}
              accent="#2c3e50"
            />
          </div>

          <div className="grid grid-2" style={{ marginBottom: '32px' }}>
            <div className="card">
              <h2 style={{ marginBottom: '8px' }}>Beverage Mix</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Share of logged fluids by beverage type. Hydration totals still apply beverage weighting separately.
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={beverageBehavior.beverageMix || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" minTickGap={16} />
                  <YAxis unit="%" />
                  <Tooltip
                    formatter={(value, _name, item) => [
                      `${value}%`,
                      `${item?.payload?.label || 'Beverage'} share`,
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="sharePercentage" fill="#8e44ad" name="Share of Logged Fluids" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h2 style={{ marginBottom: '8px' }}>Caffeine Trend</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Spot how often caffeine shows up and whether it is creeping higher across the selected window.
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="displayDate" minTickGap={24} />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} mg`, 'Caffeine']} />
                  <Legend />
                  <Line type="monotone" dataKey="caffeineMg" stroke="#e67e22" strokeWidth={3} dot={{ r: 3 }} name="Caffeine" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '32px' }}>
            <h2 style={{ marginBottom: '8px' }}>Late-Day Hydration Trend</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Fluids after {formatMinutesFromMidnight(beverageBehavior.lateDayCutoffMinutes)} can be fine, but seeing the pattern helps you judge whether most hydration is happening too late.
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="displayDate" minTickGap={24} />
                <YAxis />
                <Tooltip formatter={(value) => [formatWaterFromFlOz(value, preferredWaterUnit), 'Late-Day Hydration']} />
                <Legend />
                <Bar dataKey="lateDayHydrationOunces" fill="#2c3e50" name="Late-Day Hydration" radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {hasRecoveryBehaviorData && (
        <>
          <div className="card" style={{ marginBottom: '24px' }}>
            <h2 style={{ marginBottom: '8px' }}>Recovery &amp; Training Patterns</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Use workout completion, sleep, hydration, and recovery signals to spot what supports better training weeks without turning Lean Ledger into a workout log.
            </p>
          </div>

          <div className="grid grid-4" style={{ marginBottom: '32px' }}>
            <SummaryCard
              label="Workout Completion"
              value={recoveryBehavior.loggedWorkoutDays > 0
                ? `${analytics.summary.workoutCompletionPercentage}%`
                : 'No workout logs'}
              helper={recoveryBehavior.loggedWorkoutDays > 0
                ? `Current streak ${recoveryBehavior.currentWorkoutStreak || 0} • Longest ${recoveryBehavior.longestWorkoutStreak || 0}`
                : 'Mark workout completion in your daily check-in to track consistency.'}
              accent="#27ae60"
            />
            <SummaryCard
              label="Average Sleep"
              value={recoveryBehavior.averageSleepHours != null
                ? `${recoveryBehavior.averageSleepHours} hr`
                : 'No sleep logs'}
              helper={recoveryBehavior.workoutSleepAverage != null && recoveryBehavior.restSleepAverage != null
                ? `Workout days ${recoveryBehavior.workoutSleepAverage} hr • Rest days ${recoveryBehavior.restSleepAverage} hr`
                : 'Log sleep to compare workout and rest-day recovery.'}
              accent="#2980b9"
            />
            <SummaryCard
              label="Training Day Protein"
              value={recoveryBehavior.proteinWorkoutAverage != null
                ? `${recoveryBehavior.proteinWorkoutAverage} g`
                : 'No workout days'}
              helper={recoveryBehavior.proteinWorkoutAverage != null && recoveryBehavior.proteinRestAverage != null
                ? `Rest days ${recoveryBehavior.proteinRestAverage} g`
                : 'Helps compare how fueling shifts between workout and rest days.'}
              accent="#e74c3c"
            />
            <SummaryCard
              label="Recovery-Ready Days"
              value={recoveryBehavior.recoveryReadyLoggedDays > 0
                ? `${recoveryBehavior.recoveryReadyDays}`
                : 'No recovery logs'}
              helper={recoveryBehavior.recoveryReadyLoggedDays > 0
                ? `${recoveryBehavior.recoveryReadyLoggedDays} fully logged days met sleep 7h+, energy 4+, soreness 3 or lower`
                : 'Requires sleep, energy, and soreness on the same day.'}
              accent="#8e44ad"
            />
          </div>

          <div className="grid grid-2" style={{ marginBottom: '32px' }}>
            <div className="card">
              <h2 style={{ marginBottom: '8px' }}>Training Day Support</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Compare whether workout days are getting the protein and hydration support they need.
              </p>
              <div style={{ display: 'grid', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <span>Protein on Workout Days</span>
                  <strong>{recoveryBehavior.proteinWorkoutAverage != null ? `${recoveryBehavior.proteinWorkoutAverage} g` : 'No workout logs'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <span>Protein on Rest Days</span>
                  <strong>{recoveryBehavior.proteinRestAverage != null ? `${recoveryBehavior.proteinRestAverage} g` : 'No rest-day logs'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <span>Hydration Hit Rate on Workout Days</span>
                  <strong>{recoveryBehavior.hydrationWorkoutHitRate != null ? `${recoveryBehavior.hydrationWorkoutHitRate}%` : 'No workout hydration logs'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <span>Hydration Hit Rate on Rest Days</span>
                  <strong>{recoveryBehavior.hydrationRestHitRate != null ? `${recoveryBehavior.hydrationRestHitRate}%` : 'No rest-day hydration logs'}</strong>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 style={{ marginBottom: '8px' }}>Sleep &amp; Recovery Pattern</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Keep this directional: low sleep, energy, and soreness are most useful when they repeat.
              </p>
              <div style={{ display: 'grid', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <span>Low-Sleep Days</span>
                  <strong>{recoveryBehavior.lowSleepDays || 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <span>Energy on Low-Sleep Days</span>
                  <strong>{recoveryBehavior.lowSleepEnergyAverage != null ? `${recoveryBehavior.lowSleepEnergyAverage} / 5` : 'Not enough data'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <span>Energy with 6.5h+ Sleep</span>
                  <strong>{recoveryBehavior.adequateSleepEnergyAverage != null ? `${recoveryBehavior.adequateSleepEnergyAverage} / 5` : 'Not enough data'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <span>Workout Day Sleep</span>
                  <strong>{recoveryBehavior.workoutSleepAverage != null ? `${recoveryBehavior.workoutSleepAverage} hr` : 'Not enough data'}</strong>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {hasDailyWinsBehaviorData && (
        <>
          <div className="card" style={{ marginBottom: '24px' }}>
            <h2 style={{ marginBottom: '8px' }}>Daily Wins Patterns</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Keep Daily Wins lightweight. This view is just enough to show whether the capture loop is actually becoming consistent.
            </p>
          </div>

          <div className="grid grid-4" style={{ marginBottom: '32px' }}>
            <SummaryCard
              label="Average Wins"
              value={dailyWinsBehavior.averageCompletedWins != null ? `${dailyWinsBehavior.averageCompletedWins} / ${dailyWinsBehavior.activeTotal || activeDailyWins.length}` : 'No wins logged'}
              helper={dailyWinsBehavior.completionPercentage != null
                ? `${dailyWinsBehavior.completionPercentage}% of possible wins completed`
                : 'Log wins on Intake to start the pattern.'}
              accent="var(--primary-color)"
            />
            <SummaryCard
              label="Perfect Win Days"
              value={dailyWinsBehavior.perfectDays != null ? `${dailyWinsBehavior.perfectDays}` : '0'}
              helper={`Days where all ${dailyWinsBehavior.activeTotal || activeDailyWins.length} active Daily Wins were logged or completed`}
              accent="#27ae60"
            />
            {activeDailyWins.map((definition) => (
              <SummaryCard
                key={definition.key}
                label={`${definition.label} Consistency`}
                value={dailyWinsBehavior.habitCompletionPercentages?.[definition.key] != null
                  ? `${dailyWinsBehavior.habitCompletionPercentages[definition.key]}%`
                  : `No ${definition.label.toLowerCase()} logs`}
                helper="Share of tracked days marked complete or logged"
                accent={definition.key === 'readingCompleted' ? '#8e44ad' : definition.key === 'prayerCompleted' ? '#16a085' : undefined}
              />
            ))}
          </div>

          {dailyWinsChallengeBehavior ? (
            <div className="grid grid-4" style={{ marginBottom: '32px' }}>
              <SummaryCard
                label="Active Challenge"
                value={`${dailyWinsChallengeBehavior.templateName} • Day ${dailyWinsChallengeBehavior.dayNumber}${dailyWinsChallengeBehavior.durationDays ? ` / ${dailyWinsChallengeBehavior.durationDays}` : ''}`}
                helper={dailyWinsChallengeBehavior.daysRemaining != null
                  ? `${dailyWinsChallengeBehavior.daysRemaining} days left in the current run`
                  : 'Current template-driven challenge'}
                accent="#8e44ad"
              />
              <SummaryCard
                label="Perfect Challenge Days"
                value={`${dailyWinsChallengeBehavior.perfectDaysInRange}`}
                helper={`Perfect Daily Wins days inside this ${period}-day view`}
                accent="#27ae60"
              />
              <SummaryCard
                label="Perfect-Day Streak"
                value={`${dailyWinsChallengeBehavior.currentPerfectDayStreak}`}
                helper={`Longest streak in range: ${dailyWinsChallengeBehavior.longestPerfectDayStreak}`}
                accent="var(--primary-color)"
              />
              <SummaryCard
                label="Challenge Completion"
                value={dailyWinsChallengeBehavior.completionPercentageInRange != null
                  ? `${dailyWinsChallengeBehavior.completionPercentageInRange}%`
                  : 'No challenge logs'}
                helper={`Across ${dailyWinsChallengeBehavior.trackedDaysInRange} tracked challenge day${dailyWinsChallengeBehavior.trackedDaysInRange === 1 ? '' : 's'} in this range`}
                accent="#16a085"
              />
            </div>
          ) : null}
        </>
      )}

      {(hasWorkoutData || hasHydrationData) && (
        <div className="grid grid-2" style={{ marginBottom: '32px' }}>
          {hasWorkoutData && (
            <div className="card">
              <h2 style={{ marginBottom: '8px' }}>Workout Adherence</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Completed strength sessions help confirm muscle retention during a recomp phase.
              </p>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="displayDate" minTickGap={24} />
                  <YAxis ticks={[0, 1]} domain={[0, 1]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="workoutCompletedValue" name="Workout Completed">
                    {chartData.map((entry) => (
                      <Cell key={entry.date} fill={entry.workoutCompleted ? '#27ae60' : '#dfe6e9'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p style={{ marginTop: '14px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                Workout completion across logged days: {analytics.summary.workoutCompletionPercentage}%.
              </p>
            </div>
          )}
        </div>
      )}

      {(chartData.some((entry) => entry.consistencyScore > 0) || hasRecoveryData || advancedMetricGroups.length > 0) && (
        <details className="card" style={{ marginTop: '32px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}>Advanced Insights</summary>
          <p style={{ color: 'var(--text-secondary)', margin: '16px 0 24px' }}>
            Optional metrics and deeper analysis live here. Use them if they help decision-making, not because they look impressive.
          </p>

          {chartData.some((entry) => entry.consistencyScore > 0) && (
            <div className="card" style={{ marginBottom: (advancedMetricGroups.length > 0 || hasRecoveryData) ? '24px' : 0, boxShadow: 'none', padding: 0 }}>
              <h2 style={{ marginBottom: '8px' }}>Consistency Score Trend</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Daily consistency blends protein, calories, and any optional recovery signals you actually track. Missing data does not count against you.
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={consistencyTrendLine}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="displayDate" minTickGap={24} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="consistencyScore" stroke="var(--primary-color)" strokeWidth={3} dot={{ r: 3 }} name="Daily Consistency Score" />
                  <Line type="monotone" dataKey="weeklyAverageConsistency" stroke="#2c3e50" strokeDasharray="5 5" dot={false} name="Weekly Average" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {hasRecoveryData && (
            <div className="card" style={{ marginBottom: advancedMetricGroups.length > 0 ? '24px' : 0, boxShadow: 'none', padding: 0 }}>
              <h2 style={{ marginBottom: '8px' }}>Recovery Trend</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Recovery signals are directional. Use them to spot patterns, not to chase perfect scores.
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="displayDate" minTickGap={24} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sleepHours" stroke="#2980b9" strokeWidth={2} dot={{ r: 2 }} name="Sleep" />
                  <Line type="monotone" dataKey="energyLevel" stroke="#f39c12" strokeWidth={2} dot={{ r: 2 }} name="Energy" />
                  <Line type="monotone" dataKey="hungerLevel" stroke="#8e44ad" strokeWidth={2} dot={{ r: 2 }} name="Hunger" />
                  <Line type="monotone" dataKey="sorenessLevel" stroke="#c0392b" strokeWidth={2} dot={{ r: 2 }} name="Soreness" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {advancedMetricGroups.length > 0 && (
            <div className="grid grid-2">
              {advancedMetricGroups.map((group) => (
                <div className="card" key={group.key}>
                  <h2 style={{ marginBottom: '16px' }}>{group.title}</h2>
                  {group.rows.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={group.rows}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="displayDate" minTickGap={24} />
                        <YAxis yAxisId="left" />
                        {group.axisGroups?.right?.length ? (
                          <YAxis yAxisId="right" orientation="right" />
                        ) : null}
                        <Tooltip formatter={formatAdvancedMetricTooltip} />
                        <Legend />
                        {group.series.map((series, index) => {
                          const fieldKey = series.key;
                          const field = HEALTH_METRIC_FIELDS.find((metric) => metric.key === fieldKey);
                          const fieldMeta = getHealthMetricFieldMeta(fieldKey, profile.units);
                          const displayName = fieldMeta?.unit
                            ? `${field?.label || fieldKey} (${fieldMeta.unit})`
                            : field?.label || fieldKey;
                          const colors = ['#1f6feb', '#e74c3c', '#16a085', '#8e44ad'];
                          const singlePoint = series.pointCount <= 1;
                          return (
                            <Line
                              key={fieldKey}
                              type="monotone"
                              dataKey={fieldKey}
                              yAxisId={getAxisIdForAdvancedMetric(group, fieldKey)}
                              stroke={colors[index % colors.length]}
                              strokeWidth={2}
                              dot={singlePoint ? { r: 4 } : { r: 2 }}
                              activeDot={{ r: 5 }}
                              connectNulls={false}
                              name={displayName}
                            />
                          );
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                      No valid metrics logged for this chart yet.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </details>
      )}
    </div>
  );
}
