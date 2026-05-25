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
import { beverageApi, healthMetricsApi, profileApi, statsApi, weightApi } from '@/lib/api';
import { getAvailableAdvancedMetricGroups, HEALTH_METRIC_FIELDS } from '@/lib/healthMetrics';
import { buildTrendAnalytics } from '@/lib/trendAnalytics';
import { formatDisplayDate, getDateDaysBefore, getTodayDate } from '@/lib/utils/dateUtils';
import { formatWeight } from '@/lib/utils/unitUtils';
import { formatWaterFromFlOz, getPreferredWaterUnit } from '@/lib/water';
import Loading from '@/components/Loading';
import ErrorMessage from '@/components/ErrorMessage';

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

export default function Trends() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState(14);
  const [analytics, setAnalytics] = useState(null);
  const [profile, setProfile] = useState(null);
  const [weeklyStats, setWeeklyStats] = useState(null);

  const fetchTrends = async () => {
    try {
      setLoading(true);
      setError(null);

      const endDate = getTodayDate();
      const startDate = getDateDaysBefore(endDate, period - 1);
      const weightStartDate = getDateDaysBefore(startDate, 6);

      const [profileData, weeklyStatsData, mealTrendData, weightData, healthMetricData, beverageData] = await Promise.all([
        profileApi.getProfile(),
        statsApi.getWeeklyStats(endDate),
        statsApi.getTrends(startDate, endDate),
        weightApi.getWeightLogs({ startDate: weightStartDate, endDate }),
        healthMetricsApi.getHealthMetrics({ startDate, endDate }),
        beverageApi.getBeverages({ startDate, endDate }),
      ]);

      setProfile(profileData);
      setWeeklyStats(weeklyStatsData);
      setAnalytics(buildTrendAnalytics({
        startDate,
        endDate,
        mealTrends: mealTrendData,
        weightLogs: weightData,
        healthMetrics: healthMetricData,
        beverageEntries: beverageData,
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

  const chartData = analytics.dailySeries.map((entry) => ({
    ...entry,
    displayDate: formatDisplayDate(entry.date),
  }));

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
  const advancedMetricGroups = getAvailableAdvancedMetricGroups(chartData);
  const preferredWaterUnit = getPreferredWaterUnit(profile.units);
  const hasWaistData = chartData.some((entry) => entry.waistMeasurement != null);
  const hasWorkoutData = chartData.some((entry) => entry.workoutCompleted != null);
  const hasHydrationData = chartData.some((entry) => entry.hydrationOunces != null);
  const hasRecoveryData = chartData.some((entry) => (
    entry.sleepHours != null
    || entry.energyLevel != null
    || entry.hungerLevel != null
    || entry.sorenessLevel != null
  ));

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, marginBottom: '6px' }}>Lean Recomp Trends</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Prioritize weekly signals over noisy day-to-day swings.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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
            ? `${analytics.summary.previousWeekChange > 0 ? '+' : ''}${analytics.summary.previousWeekChange} ${profile.units === 'imperial' ? 'lbs' : 'kg'} vs previous week`
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
        <div className="card" style={{ marginBottom: '32px' }}>
          <h2 style={{ marginBottom: '8px' }}>7-Day Average Weight Trend</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Scale Weight is shown lightly. Use the 7-Day Average as the main signal.
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="displayDate" minTickGap={24} />
              <YAxis />
              <Tooltip />
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
        <div className="card">
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
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Weekly Calorie Target</span>
              <strong>{analytics.summary.weeklyCalorieTarget} kcal</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Daily Average Needed to Stay on Target</span>
              <strong>{analytics.summary.dailyAverageNeeded} kcal</strong>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '8px' }}>Body Recomposition Snapshot</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Track weight trend, protein consistency, calorie alignment, and the core recomposition signals you actually use.
          </p>
          <div style={{ display: 'grid', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Current Weight</span>
              <strong>{analytics.summary.currentWeight != null ? formatWeight(analytics.summary.currentWeight, profile.units) : 'Add weight logs'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>7-Day Average Weight</span>
              <strong>{analytics.summary.sevenDayAverageWeight != null ? formatWeight(analytics.summary.sevenDayAverageWeight, profile.units) : 'Not enough data'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Protein Adherence</span>
              <strong>{analytics.summary.proteinAdherencePercentage}%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Weekly Calorie Adherence</span>
              <strong>{analytics.summary.weeklyCalorieAdherencePercentage}%</strong>
            </div>
            {analytics.summary.waistChange != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Waist Change</span>
                <strong>{analytics.summary.waistChange > 0 ? '+' : ''}{analytics.summary.waistChange} in</strong>
              </div>
            )}
            {analytics.summary.workoutCompletionPercentage != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Workout Completion</span>
                <strong>{analytics.summary.workoutCompletionPercentage}%</strong>
              </div>
            )}
            {analytics.summary.hydrationAdherencePercentage != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Hydration Adherence</span>
                <strong>{analytics.summary.hydrationAdherencePercentage}%</strong>
              </div>
            )}
          </div>
        </div>
      </div>

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
          <h2 style={{ marginBottom: '8px' }}>Keto / Flex Carb Visualization</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Keto weekdays stay tighter. Flexible weekends can run higher, but still within the weekly plan.
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="displayDate" minTickGap={24} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="carbs" name="Net Carbs" radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.date}
                    fill={entry.carbWithinTarget
                      ? (entry.isFlexibleDay ? '#f39c12' : '#3498db')
                      : '#f44336'}
                  />
                ))}
              </Bar>
              <Line type="monotone" dataKey="carbTargetMax" stroke="#2c3e50" strokeWidth={2} dot={false} name="Carb Target Max" />
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gap: '8px', marginTop: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            <p style={{ margin: 0 }}>Blue bars: keto-style days in range.</p>
            <p style={{ margin: 0 }}>Amber bars: flexible weekend days in range.</p>
            <p style={{ margin: 0 }}>Red bars: carbs landed outside the selected diet style target.</p>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '32px' }}>
          <EmptyTrendCard title="Keto / Flex Carb Visualization" body="Log meals to compare daily net carbs against your selected diet style target." />
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
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="displayDate" minTickGap={24} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {group.fields.map((fieldKey, index) => {
                        const field = HEALTH_METRIC_FIELDS.find((metric) => metric.key === fieldKey);
                        const colors = ['#1f6feb', '#e74c3c', '#16a085', '#8e44ad'];
                        return (
                          <Line
                            key={fieldKey}
                            type="monotone"
                            dataKey={fieldKey}
                            stroke={colors[index % colors.length]}
                            strokeWidth={2}
                            dot={false}
                            name={field?.label || fieldKey}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          )}
        </details>
      )}
    </div>
  );
}
