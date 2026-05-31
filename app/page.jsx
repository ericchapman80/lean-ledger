'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { beverageApi, healthMetricsApi, statsApi, profileApi } from '@/lib/api';
import {
  getHealthMetricDisplayValue,
  getHealthMetricFieldMeta,
  getHealthMetricInputProps,
} from '@/lib/healthMetrics';
import { getTodayDate, formatDisplayDate } from '@/lib/utils/dateUtils';
import { getProgressSemantics, getWaterProgressSemantics } from '@/lib/dashboardProgress';
import { getGoalDescription } from '@/lib/utils/macroUtils';
import { formatWeight } from '@/lib/utils/unitUtils';
import {
  formatBeverageFromFlOz,
  getHydrationHelperCopy,
  getPreferredBeverageUnit,
  summarizeBeverageEntries,
} from '@/lib/beverages';
import { getHydrationFeedback } from '@/lib/hydrationFeedback';
import { getPrimaryCarbLabel } from '@/lib/carbUtils';
import Loading from '@/components/Loading';
import ErrorMessage from '@/components/ErrorMessage';
import HydrationFeedback from '@/components/HydrationFeedback';
import ProgressBar from '@/components/ProgressBar';
import MacroCard from '@/components/MacroCard';

const DEFAULT_CHECKIN_TIME = '20:00';

function getEmptyCheckIn(date, metric = null, units = 'metric') {
  return {
    recordedAt: metric?.recordedAt || (date ? `${date}T${DEFAULT_CHECKIN_TIME}` : ''),
    waistMeasurement: metric?.waistMeasurement != null
      ? String(getHealthMetricDisplayValue('waistMeasurement', metric.waistMeasurement, units))
      : '',
    workoutCompleted: metric?.workoutCompleted == null ? '' : String(metric.workoutCompleted),
    hydrationOunces: metric?.hydrationOunces ?? '',
    sleepHours: metric?.sleepHours ?? '',
    energyLevel: metric?.energyLevel ?? '',
    hungerLevel: metric?.hungerLevel ?? '',
    sorenessLevel: metric?.sorenessLevel ?? '',
    progressPhotoCount: metric?.progressPhotoCount ?? '',
    progressPhotoNote: metric?.progressPhotoNote ?? '',
  };
}

function hasCoreCheckInData(metric) {
  if (!metric) return false;
  return [
    'waistMeasurement',
    'workoutCompleted',
    'hydrationOunces',
    'sleepHours',
    'energyLevel',
    'hungerLevel',
    'sorenessLevel',
    'progressPhotoCount',
    'progressPhotoNote',
  ].some((key) => metric[key] != null && metric[key] !== '');
}

function countLoggedSignals(checkIn) {
  return [
    checkIn.waistMeasurement,
    checkIn.workoutCompleted,
    checkIn.sleepHours,
    checkIn.energyLevel,
    checkIn.hungerLevel,
    checkIn.sorenessLevel,
  ].filter((value) => value !== '' && value != null).length;
}

export default function Dashboard() {
  const initialDate = typeof window === 'undefined' ? '' : getTodayDate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [weeklyStats, setWeeklyStats] = useState(null);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [checkIn, setCheckIn] = useState(getEmptyCheckIn(initialDate));
  const [beverageEntries, setBeverageEntries] = useState([]);
  const [checkInSavedAt, setCheckInSavedAt] = useState(null);
  const [savingCheckIn, setSavingCheckIn] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, profileData, weeklyStatsData, healthMetricData, beverageData] = await Promise.all([
        statsApi.getDailyStats(selectedDate),
        profileApi.getProfile(),
        statsApi.getWeeklyStats(selectedDate),
        healthMetricsApi.getHealthMetrics({ startDate: selectedDate, endDate: selectedDate }),
        beverageApi.getBeverages({ date: selectedDate }),
      ]);
      setStats(statsData);
      setProfile(profileData);
      setWeeklyStats(weeklyStatsData);
      const dailyCheckIn = healthMetricData.find(hasCoreCheckInData) || null;
      setCheckIn(getEmptyCheckIn(selectedDate, dailyCheckIn, profileData.units || 'metric'));
      setBeverageEntries(beverageData);
      setCheckInSavedAt(dailyCheckIn?.updatedAt || null);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(getTodayDate());
    }
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedDate) return;
    fetchData();
  }, [selectedDate]);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} onRetry={fetchData} />;
  if (!stats || !profile) return <ErrorMessage error="No data available" />;

  const {
    totals,
    targets,
    progress,
    mealCount,
    foodEntryCount = stats.meals?.length ?? 0,
    mealTypes = [],
  } = stats;
  const loggedSignals = countLoggedSignals(checkIn);
  const mealTypeSummary = mealTypes.map((meal) => meal.label).join(' • ');
  const preferredBeverageUnit = getPreferredBeverageUnit(profile.units);
  const beverageSummary = summarizeBeverageEntries(beverageEntries, {
    preferredUnit: preferredBeverageUnit,
    weightKg: profile.weight,
    workoutCompleted: checkIn.workoutCompleted === 'true' || checkIn.workoutCompleted === true,
  });
  const waterProgress = getWaterProgressSemantics({
    current: beverageSummary.hydrationFlOz,
    target: beverageSummary.targetFlOz,
    currentHour: new Date().getHours(),
    isCurrentDay: selectedDate === getTodayDate(),
  });
  const hydrationRatioLabel = `${beverageSummary.display.consumed} / ${beverageSummary.display.target}`;
  const hydrationAmountLabel = beverageSummary.remainingFlOz > 0
    ? `${beverageSummary.display.remaining} remaining`
    : `${formatBeverageFromFlOz(beverageSummary.hydrationFlOz - beverageSummary.targetFlOz, preferredBeverageUnit)} above target`;
  const hydrationHelper = getHydrationHelperCopy({
    dietStyle: profile.dietStyle,
    workoutCompleted: checkIn.workoutCompleted === 'true' || checkIn.workoutCompleted === true,
  });
  const hydrationFeedback = getHydrationFeedback({
    entries: beverageEntries,
    summary: beverageSummary,
    dietStyle: profile.dietStyle,
    workoutCompleted: checkIn.workoutCompleted === 'true' || checkIn.workoutCompleted === true,
    isCurrentDay: selectedDate === getTodayDate(),
    currentHour: new Date().getHours(),
  });
  const waistMeta = getHealthMetricFieldMeta('waistMeasurement', profile.units);
  const waistInputProps = getHealthMetricInputProps('waistMeasurement', profile.units);
  const calorieProgress = getProgressSemantics({
    macroKey: 'calories',
    current: totals.calories,
    target: targets.calories,
    dietStyle: profile.dietStyle,
  });
  const carbTracking = stats.carbTracking || {
    label: getPrimaryCarbLabel(profile.dietStyle),
    current: totals.carbs,
    target: targets.carbs,
    totalCarbs: totals.carbs,
    fiber: totals.fiber || 0,
    sugarAlcohols: totals.sugarAlcohols || 0,
    netCarbs: totals.netCarbs || totals.carbs,
  };

  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    try {
      setSavingCheckIn(true);
      await healthMetricsApi.createHealthMetric({
        ...checkIn,
        workoutCompleted: checkIn.workoutCompleted === '' ? null : checkIn.workoutCompleted === 'true',
      });
      await fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingCheckIn(false);
    }
  };

  return (
    <div className="container" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, marginBottom: '8px', fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>
            Daily Dashboard
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            {formatDisplayDate(selectedDate)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch', flexWrap: 'wrap' }}>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="form-input"
            style={{ flex: '1 1 auto', minWidth: '150px', maxWidth: '300px' }}
          />
          <Link href="/meals" className="btn btn-primary" style={{ flex: '0 1 auto' }}>
            <span className="hide-xs">+ Add </span>Intake
          </Link>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: '32px' }}>
        <MacroCard label="Protein" current={totals.protein} target={targets.protein} icon="🥩" macroKey="protein" dietStyle={profile.dietStyle} />
        <MacroCard label={carbTracking.label} current={carbTracking.current} target={carbTracking.target} icon="🍞" macroKey="carbs" dietStyle={profile.dietStyle} />
        <MacroCard label="Fat"     current={totals.fat}     target={targets.fat}     icon="🥑" macroKey="fat" dietStyle={profile.dietStyle} />
        <div className="card">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔥</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>Calories</h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: calorieProgress.colorVar }}>
              {Math.round(totals.calories)}
            </div>
            <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
              {calorieProgress.ratioLabel}
            </p>
            <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
              {calorieProgress.icon} {calorieProgress.stateLabel}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2 style={{ marginBottom: '24px' }}>Today's Progress</h2>
          <ProgressBar label="Protein"  current={totals.protein}  target={targets.protein} macroKey="protein" dietStyle={profile.dietStyle} />
          <ProgressBar label={carbTracking.label} current={carbTracking.current} target={carbTracking.target} macroKey="carbs" dietStyle={profile.dietStyle} />
          {(carbTracking.totalCarbs > 0 || carbTracking.fiber > 0 || carbTracking.sugarAlcohols > 0) ? (
            <p style={{ marginTop: '-4px', marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Total {Math.round(carbTracking.totalCarbs)}g • Fiber {Math.round(carbTracking.fiber)}g
              {carbTracking.sugarAlcohols > 0 ? ` • Sugar Alcohols ${Math.round(carbTracking.sugarAlcohols)}g` : ''}
              {` • Net ${Math.round(carbTracking.netCarbs)}g`}
            </p>
          ) : null}
          <ProgressBar label="Fat"      current={totals.fat}      target={targets.fat} macroKey="fat" dietStyle={profile.dietStyle} />
          <ProgressBar label="Calories" current={totals.calories} target={targets.calories} macroKey="calories" dietStyle={profile.dietStyle} />
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '14px',
                gap: '12px',
              }}
            >
              <span style={{ fontWeight: '600' }}>Hydration</span>
              <span style={{ textAlign: 'right' }}>
                {hydrationRatioLabel}
                {' '}
                <span style={{ color: 'var(--text-secondary)' }}>
                  ({waterProgress.percentage}%)
                </span>
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                gap: '12px',
              }}
            >
              <span>{waterProgress.icon} {waterProgress.stateLabel}</span>
              <span>{hydrationAmountLabel}</span>
            </div>
            <div className="progress-bar">
              <div
                className={`progress-bar-fill ${waterProgress.className}`}
                style={{ width: `${waterProgress.cappedPercentage}%`, backgroundColor: waterProgress.colorVar }}
              >
                {waterProgress.cappedPercentage > 10 && `${waterProgress.percentage}%`}
              </div>
            </div>
            <div style={{ marginTop: '8px' }}>
              <Link
                href="/meals#beverages"
                style={{
                  color: 'var(--primary-color)',
                  fontWeight: 600,
                  fontSize: '13px',
                  textDecoration: 'none',
                }}
              >
                Log in Intake
              </Link>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '24px' }}>Quick Stats</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Meals Today</p>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary-color)' }}>{mealCount}</p>
              {mealTypeSummary ? (
                <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {mealTypeSummary}
                </p>
              ) : null}
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Foods Logged</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{foodEntryCount}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Current Goal</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{getGoalDescription(profile.goal)}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Calories Remaining</p>
              <p style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: calorieProgress.colorVar,
              }}>
                {calorieProgress.overBy > 0 ? calorieProgress.amountLabel : `${Math.round(calorieProgress.remaining)} kcal`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '16px' }}>
          <div>
            <h2 style={{ marginBottom: '8px' }}>Hydration</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              Keep this ambient here. Log food, beverages, and the full intake timeline inside Intake.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: waterProgress.colorVar }}>
              {beverageSummary.display.consumed} / {beverageSummary.display.target}
            </p>
            <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
              {beverageSummary.remainingFlOz > 0
                ? `${beverageSummary.display.remaining} remaining`
                : `${formatBeverageFromFlOz(beverageSummary.hydrationFlOz - beverageSummary.targetFlOz, preferredBeverageUnit)} above target`}
            </p>
            <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
              {waterProgress.icon} {waterProgress.stateLabel}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '6px' }}>
          <HydrationFeedback feedback={hydrationFeedback} style={{ marginBottom: '4px' }} />
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
            Baseline target: {formatBeverageFromFlOz(beverageSummary.baselineFlOz, preferredBeverageUnit)}
            {beverageSummary.workoutBonusFlOz > 0 ? ` • workout adjustment: +${formatBeverageFromFlOz(beverageSummary.workoutBonusFlOz, preferredBeverageUnit)}` : ''}
          </p>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
            Total fluids: {beverageSummary.display.totalFluids}
          </p>
          {hydrationHelper.map((message) => (
            <p key={message} style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
              {message}
            </p>
          ))}
        </div>

        <div style={{ marginTop: '14px' }}>
          <Link
            href="/meals#beverages"
            style={{
              color: 'var(--primary-color)',
              fontWeight: 600,
              fontSize: '14px',
              textDecoration: 'none',
            }}
          >
            Open Intake
          </Link>
        </div>
      </div>

      {profile.goal === 'recomp' && (
        <details className="card" style={{ marginTop: '32px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}>
            Lean Recomp Check-In
            <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>
              {` • ${loggedSignals} signals logged`}
            </span>
          </summary>
          <p style={{ color: 'var(--text-secondary)', margin: '16px 0 20px' }}>
            Keep this fast. Waist, workouts, sleep, and recovery are optional signals that sharpen the weekly trend. Hydration lives in Intake so the dashboard stays summary-first.
          </p>

          <form onSubmit={handleCheckInSubmit}>
            <div className="grid grid-2" style={{ marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label">Waist ({waistMeta.unit})</label>
                <input
                  type="number"
                  className="form-input"
                  min={waistInputProps.min}
                  max={waistInputProps.max}
                  step={waistInputProps.step}
                  value={checkIn.waistMeasurement}
                  onChange={(e) => setCheckIn((current) => ({ ...current, waistMeasurement: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Workout Completed</label>
                <select
                  className="form-select"
                  value={checkIn.workoutCompleted}
                  onChange={(e) => setCheckIn((current) => ({ ...current, workoutCompleted: e.target.value }))}
                >
                  <option value="">Not tracked</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Sleep Hours</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  max="16"
                  step="0.1"
                  value={checkIn.sleepHours}
                  onChange={(e) => setCheckIn((current) => ({ ...current, sleepHours: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
            </div>

            <details style={{ marginBottom: '20px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Recovery Signals</summary>
              <div className="grid grid-3" style={{ marginTop: '12px' }}>
                {[
                  ['energyLevel', 'Energy'],
                  ['hungerLevel', 'Hunger'],
                  ['sorenessLevel', 'Soreness'],
                ].map(([key, label]) => (
                  <div className="form-group" key={key}>
                    <label className="form-label">{label} (1-5)</label>
                    <select
                      className="form-select"
                      value={checkIn[key]}
                      onChange={(e) => setCheckIn((current) => ({ ...current, [key]: e.target.value }))}
                    >
                      <option value="">Not tracked</option>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </details>

            <details style={{ marginBottom: '20px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Progress Photo Placeholder</summary>
              <p style={{ color: 'var(--text-secondary)', margin: '12px 0 16px' }}>
                Image uploads are not live yet. Use this to note that photos were taken.
              </p>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Photo Count</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    max="20"
                    step="1"
                    value={checkIn.progressPhotoCount}
                    onChange={(e) => setCheckIn((current) => ({ ...current, progressPhotoCount: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Note</label>
                  <input
                    type="text"
                    className="form-input"
                    value={checkIn.progressPhotoNote}
                    onChange={(e) => setCheckIn((current) => ({ ...current, progressPhotoNote: e.target.value }))}
                    placeholder="Front / side / back, lighting, etc."
                  />
                </div>
              </div>
            </details>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={savingCheckIn}>
                {savingCheckIn ? 'Saving...' : 'Save Check-In'}
              </button>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                {checkInSavedAt
                  ? `Updated for ${formatDisplayDate(selectedDate)}.`
                  : 'All fields are optional. Leave anything blank that you do not want to track.'}
              </p>
            </div>
          </form>
        </details>
      )}

      {profile.goal === 'recomp' && weeklyStats && (
        <details className="card" style={{ marginTop: '32px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}>Weekly Lean Recomp Check-In</summary>
          <div style={{ marginTop: '16px', display: 'grid', gap: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <p style={{ margin: '0 0 6px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                  {formatDisplayDate(weeklyStats.weekStart)} to {formatDisplayDate(weeklyStats.weekEnd)}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>{weeklyStats.remaining.calories} kcal</strong> left this week and{' '}
                  <strong>{weeklyStats.remaining.protein} g</strong> protein remaining.
                </p>
              </div>
              <span style={{
                fontSize: '12px',
                fontWeight: 'bold',
                padding: '6px 10px',
                borderRadius: '999px',
                background: 'rgba(52, 152, 219, 0.08)',
                color: 'var(--primary-color)',
              }}>
                {weeklyStats.elapsedDays}/7 days
              </span>
            </div>

            <div className="grid grid-2">
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Daily calorie target</span>
                  <strong>{weeklyStats.dailyTargets.calories} kcal</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Weekly calorie target</span>
                  <strong>{weeklyStats.weeklyTargets.calories} kcal</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Weekly protein target</span>
                  <strong>{weeklyStats.weeklyTargets.protein} g</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Average calories consumed</span>
                  <strong>{weeklyStats.averages.calories} kcal</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Average protein consumed</span>
                  <strong>{weeklyStats.averages.protein} g</strong>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>7-day average weight</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                    {weeklyStats.focus.sevenDayAverageWeight != null
                      ? formatWeight(weeklyStats.focus.sevenDayAverageWeight, profile.units)
                      : 'Add weight logs'}
                  </p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Protein consistency</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                    {weeklyStats.focus.proteinConsistency.daysHit}/{weeklyStats.focus.proteinConsistency.totalDays} days
                  </p>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    Hit your protein goal on {weeklyStats.focus.proteinConsistency.percentage}% of days this week.
                  </p>
                </div>
              </div>
            </div>

            {profile.dietStyle === 'keto_flexible' && (
              <p style={{
                margin: 0,
                color: 'var(--text-secondary)',
                fontSize: '14px',
                lineHeight: 1.5,
              }}>
                Flexible weekends are included in your weekly target. Flexibility does not mean unlimited.
              </p>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
