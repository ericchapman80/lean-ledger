'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { beverageApi, bodyCompositionGoalsApi, dailyHabitsApi, habitDefinitionsApi, healthMetricsApi, statsApi, profileApi } from '@/lib/api';
import { toast } from '@/lib/toast';
import { getHealthMetricDisplayValue } from '@/lib/healthMetrics';
import { getTodayDate, formatDisplayDate } from '@/lib/utils/dateUtils';
import { getProgressSemantics, getWaterProgressSemantics } from '@/lib/dashboardProgress';
import { getGoalDescription } from '@/lib/utils/macroUtils';
import { formatWeight } from '@/lib/utils/unitUtils';
import { formatBodyFatTarget, formatGoalDate, formatGoalMass, formatGoalPercent, getBodyCompositionStatusMeta, getGoalOutcomeLabel } from '@/lib/bodyCompositionGoalDisplay';
import { getDailyWinsSummary, getDailyWinsValues, mergeDailyWinDefinitions } from '@/lib/dailyWins';
import {
  formatBeverageFromFlOz,
  getHydrationHelperCopy,
  getPreferredBeverageUnit,
  summarizeBeverageEntries,
} from '@/lib/beverages';
import { getHydrationFeedback } from '@/lib/hydrationFeedback';
import { getPrimaryCarbLabel } from '@/lib/carbUtils';
import { buildDailyWinChallengeSummary } from '@/lib/dailyWinTemplates';
import Loading from '@/components/Loading';
import ErrorMessage from '@/components/ErrorMessage';
import HydrationFeedback from '@/components/HydrationFeedback';
import ProgressBar from '@/components/ProgressBar';
import MacroCard from '@/components/MacroCard';

function getEmptyCheckIn(date, metric = null, units = 'metric') {
  return {
    ...getDailyWinsValues(date, metric),
    waistMeasurement: metric?.waistMeasurement != null
      ? String(getHealthMetricDisplayValue('waistMeasurement', metric.waistMeasurement, units))
      : '',
    hydrationOunces: metric?.hydrationOunces ?? '',
    hungerLevel: metric?.hungerLevel ?? '',
    progressPhotoCount: metric?.progressPhotoCount ?? '',
    progressPhotoNote: metric?.progressPhotoNote ?? '',
  };
}

function hasCoreCheckInData(metric) {
  if (!metric) return false;
  return [
    'waistMeasurement',
    'workoutCompleted',
    'dayType',
    'readingCompleted',
    'prayerCompleted',
    'hydrationOunces',
    'sleepHours',
    'energyLevel',
    'hungerLevel',
    'sorenessLevel',
    'progressPhotoCount',
    'progressPhotoNote',
  ].some((key) => metric[key] != null && metric[key] !== '');
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
  const [customHabits, setCustomHabits] = useState([]);
  const [beverageEntries, setBeverageEntries] = useState([]);
  const [bodyCompositionGoal, setBodyCompositionGoal] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, profileData, weeklyStatsData, healthMetricData, beverageData, customHabitData, dailyHabitLogData, goalData] = await Promise.all([
        statsApi.getDailyStats(selectedDate),
        profileApi.getProfile(),
        statsApi.getWeeklyStats(selectedDate),
        healthMetricsApi.getHealthMetrics({ startDate: selectedDate, endDate: selectedDate }),
        beverageApi.getBeverages({ date: selectedDate }),
        habitDefinitionsApi.getHabitDefinitions(),
        dailyHabitsApi.getDailyHabitLogs({ startDate: selectedDate, endDate: selectedDate }),
        bodyCompositionGoalsApi.getGoals(),
      ]);
      setStats(statsData);
      setProfile(profileData);
      setWeeklyStats(weeklyStatsData);
      const dailyCheckIn = healthMetricData.find(hasCoreCheckInData) || null;
      setCustomHabits(customHabitData);
      setCheckIn({
        ...getEmptyCheckIn(selectedDate, dailyCheckIn, profileData.units || 'metric'),
        ...getDailyWinsValues(selectedDate, dailyCheckIn, customHabitData, dailyHabitLogData),
      });
      setBeverageEntries(beverageData);
      setBodyCompositionGoal(goalData?.activeGoal || null);
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
  const mealTypeSummary = mealTypes.map((meal) => meal.label).join(' • ');
  const preferredBeverageUnit = getPreferredBeverageUnit(profile.units);
  const beverageSummary = summarizeBeverageEntries(beverageEntries, {
    preferredUnit: preferredBeverageUnit,
    weightKg: profile.weight,
    workoutCompleted: checkIn.workoutCompleted === 'true' || checkIn.workoutCompleted === true,
    dietStyle: profile.dietStyle,
    date: selectedDate,
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
  const hydrationTargetBreakdown = [
    `base ${formatBeverageFromFlOz(beverageSummary.baselineFlOz, preferredBeverageUnit)}`,
    beverageSummary.workoutBonusFlOz > 0
      ? `workout ${formatBeverageFromFlOz(beverageSummary.workoutBonusFlOz, preferredBeverageUnit)}`
      : null,
    beverageSummary.dietStyleBonusFlOz > 0
      ? `${beverageSummary.dietStyleBonusLabel} ${formatBeverageFromFlOz(beverageSummary.dietStyleBonusFlOz, preferredBeverageUnit)}`
      : null,
  ].filter(Boolean);
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
  const activeDailyWins = mergeDailyWinDefinitions(profile?.dailyWinsActiveKeys, customHabits);
  const dailyWinsSummary = getDailyWinsSummary(checkIn, activeDailyWins);
  const activeDailyWinLabels = activeDailyWins.map((definition) => definition.label).join(' • ');
  const dailyWinsChallenge = buildDailyWinChallengeSummary({
    templateKey: profile.dailyWinsTemplateKey,
    challengeStartDate: profile.dailyWinsChallengeStartDate,
    referenceDate: selectedDate,
    dailyWinsSummary,
  });
  const bodyGoalStatus = getBodyCompositionStatusMeta(bodyCompositionGoal?.status?.overall);
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

      {bodyCompositionGoal ? (
        <div className="card" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', marginBottom: '18px' }}>
            <div>
              <h2 style={{ margin: '0 0 8px' }}>Body Composition Goal</h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                {bodyCompositionGoal.name} • started {formatGoalDate(bodyCompositionGoal.baseline?.recordedAt?.slice(0, 10))}
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

          <div className="grid grid-4" style={{ marginBottom: '16px' }}>
            <div style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--surface-muted)' }}>
              <p style={{ margin: '0 0 6px', color: 'var(--text-secondary)', fontSize: '13px' }}>Weight Progress</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                {formatGoalMass(bodyCompositionGoal.current?.weight, profile.units)} → {formatGoalMass(bodyCompositionGoal.goalWeight, profile.units)}
              </p>
              <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                {bodyCompositionGoal.progress?.remainingWeightToGoal != null
                  ? `${formatGoalMass(bodyCompositionGoal.progress.remainingWeightToGoal, profile.units)} remaining`
                  : 'Needs current weight data'}
              </p>
            </div>
            <div style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--surface-muted)' }}>
              <p style={{ margin: '0 0 6px', color: 'var(--text-secondary)', fontSize: '13px' }}>Fat Loss Progress</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                {formatGoalPercent(bodyCompositionGoal.current?.bodyFatPercent)} → {formatBodyFatTarget(bodyCompositionGoal)}
              </p>
              <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                {bodyCompositionGoal.progress?.remainingFatToLose != null
                  ? `${formatGoalMass(bodyCompositionGoal.progress.remainingFatToLose, profile.units)} estimated fat remaining`
                  : 'Needs body fat measurements'}
              </p>
            </div>
            <div style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--surface-muted)' }}>
              <p style={{ margin: '0 0 6px', color: 'var(--text-secondary)', fontSize: '13px' }}>Lean Mass Retention</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                Current {formatGoalMass(bodyCompositionGoal.current?.leanMass, profile.units)}
              </p>
              <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                Floor {formatGoalMass(bodyCompositionGoal.minimumLeanMass, profile.units)}
                {bodyCompositionGoal.progress?.leanMassChangeSinceStart != null ? ` • ${bodyCompositionGoal.progress.leanMassChangeSinceStart > 0 ? '+' : ''}${formatGoalMass(bodyCompositionGoal.progress.leanMassChangeSinceStart, profile.units)} since start` : ''}
              </p>
            </div>
            <div style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--surface-muted)' }}>
              <p style={{ margin: '0 0 6px', color: 'var(--text-secondary)', fontSize: '13px' }}>Muscle Mass Retention</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                Current {formatGoalMass(bodyCompositionGoal.current?.muscleMass, profile.units)}
              </p>
              <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                Floor {formatGoalMass(bodyCompositionGoal.minimumMuscleMass, profile.units)}
                {bodyCompositionGoal.progress?.muscleMassChangeSinceStart != null ? ` • ${bodyCompositionGoal.progress.muscleMassChangeSinceStart > 0 ? '+' : ''}${formatGoalMass(bodyCompositionGoal.progress.muscleMassChangeSinceStart, profile.units)} since start` : ''}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: '0 0 6px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                Estimated completion: {bodyCompositionGoal.estimatedCompletionDate
                  ? `${formatGoalDate(bodyCompositionGoal.estimatedCompletionDate)} (${bodyCompositionGoal.estimatedCompletionLabel})`
                  : 'Not enough trend data yet'}
              </p>
              {bodyCompositionGoal.status?.warnings?.length > 0 ? (
                bodyCompositionGoal.status.warnings.map((warning) => (
                  <p key={warning} style={{ margin: '0 0 4px', color: 'var(--warning-color)', fontSize: '13px' }}>
                    {warning}
                  </p>
                ))
              ) : (
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
                  Goal evaluation prioritizes lean mass and muscle preservation over scale weight alone.
                </p>
              )}
              {getGoalOutcomeLabel(bodyCompositionGoal) ? (
                <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  Outcome: {getGoalOutcomeLabel(bodyCompositionGoal)}
                </p>
              ) : null}
            </div>
            <Link href="/profile" className="btn btn-outline">
              Manage Goal
            </Link>
          </div>
        </div>
      ) : null}

      <div className="card" style={{ marginBottom: '32px' }}>
        {activeDailyWins.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: '0 0 6px' }}>Daily Wins</h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                No Daily Wins configured.
              </p>
            </div>
            <Link href="/profile" className="btn btn-outline">
              Configure Daily Wins
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: '0 0 6px' }}>Daily Wins</h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                Intake is the main place to log today&apos;s wins. Dashboard stays summary-only.
              </p>
              {activeDailyWinLabels ? (
                <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  Active: {activeDailyWinLabels}
                </p>
              ) : null}
              {dailyWinsChallenge ? (
                <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {dailyWinsChallenge.templateName} • Day {dailyWinsChallenge.dayNumber}
                  {dailyWinsChallenge.durationDays ? ` of ${dailyWinsChallenge.durationDays}` : ''}
                  {dailyWinsChallenge.daysRemaining != null ? ` • ${dailyWinsChallenge.daysRemaining} days left` : ''}
                </p>
              ) : null}
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                {dailyWinsSummary.completed} / {dailyWinsSummary.total}
              </p>
              <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                {dailyWinsSummary.percentage}% complete
              </p>
            </div>
          </div>
        )}
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
              <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{getGoalDescription(profile.goalStrategy || profile.goal)}</p>
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

        <div style={{ display: 'grid', gap: '8px' }}>
          <HydrationFeedback feedback={hydrationFeedback} style={{ marginBottom: '4px' }} />
          <details>
            <summary style={{ cursor: 'pointer', color: 'var(--primary-color)', fontWeight: 600, fontSize: '14px' }}>
              Read more
            </summary>
            <div style={{ display: 'grid', gap: '6px', marginTop: '8px' }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                Target: {hydrationTargetBreakdown.join(' + ')}
              </p>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                Total fluids: {beverageSummary.display.totalFluids}
              </p>
              {beverageSummary.display.totalFluids !== beverageSummary.display.consumed ? (
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Weighted hydration: {beverageSummary.display.consumed}
                </p>
              ) : null}
              {hydrationHelper.map((message) => (
                <p key={message} style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                  {message}
                </p>
              ))}
            </div>
          </details>
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

      {dailyWinsSummary.total > 0 ? (
        <div className="card" style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
              Today&apos;s Wins
              <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>
                {` • ${dailyWinsSummary.completed} of ${dailyWinsSummary.total}`}
              </span>
            </h3>
            <Link
              href="/meals#daily-wins"
              style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}
            >
              Edit in Intake →
            </Link>
          </div>
          {activeDailyWinLabels ? (
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>{activeDailyWinLabels}</p>
          ) : null}
        </div>
      ) : null}

      {(((profile.goalStrategy || profile.goal) === 'lean_recomp') || profile.goal === 'recomp') && weeklyStats ? (
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
                background: 'var(--feedback-info-surface)',
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
      ) : null}
    </div>
  );
}
