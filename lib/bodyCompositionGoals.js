import { deriveAgeGroup } from './coachingProfile.js';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const BODY_COMPOSITION_STATUS = {
  GREEN: 'green',
  YELLOW: 'yellow',
  RED: 'red',
};

const WARNING_BAND_KG = 0.9;
const MIN_ESTIMATE_ENTRIES = 3;
const MIN_ESTIMATE_DAYS = 14;
const RETENTION_WATCH_PERCENT = 99;
const RETENTION_ALERT_PERCENT = 97;

function round(value, precision = 1) {
  if (!Number.isFinite(Number(value))) return null;
  const factor = 10 ** precision;
  return Math.round(Number(value) * factor) / factor;
}

function toNumberOrNull(value) {
  if (value === '' || value == null) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function toDateMs(value) {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function addDays(dateString, days) {
  const ms = Date.parse(`${dateString}T12:00:00Z`);
  if (!Number.isFinite(ms)) return null;
  const next = new Date(ms + (days * 24 * 60 * 60 * 1000));
  return next.toISOString().slice(0, 10);
}

function getLatestBy(items, key) {
  return [...items].sort((a, b) => (toDateMs(b[key]) ?? 0) - (toDateMs(a[key]) ?? 0))[0] ?? null;
}

function percentToRatio(percent) {
  const numeric = toNumberOrNull(percent);
  return numeric == null ? null : numeric / 100;
}

export function calculateFatMass(weight, bodyFatPercent) {
  const numericWeight = toNumberOrNull(weight);
  const ratio = percentToRatio(bodyFatPercent);
  if (numericWeight == null || ratio == null) return null;
  return round(numericWeight * ratio, 1);
}

export function calculateLeanMass(weight, bodyFatPercent) {
  const numericWeight = toNumberOrNull(weight);
  const fatMass = calculateFatMass(numericWeight, bodyFatPercent);
  if (numericWeight == null || fatMass == null) return null;
  return round(numericWeight - fatMass, 1);
}

export function validateBodyCompositionGoalPayload(payload, { requireTargetDate = true } = {}) {
  const phaseType = payload.phaseType ?? 'cut';
  if (phaseType !== 'cut') return 'Only cut phases are supported right now.';

  const goalWeight = toNumberOrNull(payload.goalWeight);
  const goalBodyFatPercent = toNumberOrNull(payload.goalBodyFatPercent);
  const targetBodyFatMin = toNumberOrNull(payload.targetBodyFatMin);
  const targetBodyFatMax = toNumberOrNull(payload.targetBodyFatMax);
  const minimumLeanMass = toNumberOrNull(payload.minimumLeanMass);
  const minimumMuscleMass = toNumberOrNull(payload.minimumMuscleMass);

  if (
    goalWeight == null
    && goalBodyFatPercent == null
    && targetBodyFatMin == null
    && targetBodyFatMax == null
  ) {
    return 'Add at least a goal weight or body fat target.';
  }

  if (targetBodyFatMin != null && targetBodyFatMax != null && targetBodyFatMin > targetBodyFatMax) {
    return 'Body fat target range is invalid.';
  }

  if (requireTargetDate && !payload.targetDate) {
    return 'Target date is required.';
  }

  if (payload.targetDate && !DATE_ONLY_PATTERN.test(payload.targetDate)) {
    return 'Target date must be YYYY-MM-DD.';
  }

  const massFields = [
    ['goal weight', goalWeight],
    ['minimum lean mass', minimumLeanMass],
    ['minimum muscle mass', minimumMuscleMass],
  ];
  for (const [label, value] of massFields) {
    if (value != null && value <= 0) return `${label} must be greater than zero.`;
  }

  const percentFields = [
    ['goal body fat', goalBodyFatPercent],
    ['minimum body fat', targetBodyFatMin],
    ['maximum body fat', targetBodyFatMax],
  ];
  for (const [label, value] of percentFields) {
    if (value != null && (value <= 0 || value > 100)) return `${label} must be between 0 and 100.`;
  }

  return null;
}

export function normalizeBodyCompositionGoalInput(payload) {
  return {
    name: payload.name?.trim() || 'Cut Phase',
    phaseType: payload.phaseType ?? 'cut',
    goalWeight: toNumberOrNull(payload.goalWeight),
    goalBodyFatPercent: toNumberOrNull(payload.goalBodyFatPercent),
    targetBodyFatMin: toNumberOrNull(payload.targetBodyFatMin),
    targetBodyFatMax: toNumberOrNull(payload.targetBodyFatMax),
    minimumLeanMass: toNumberOrNull(payload.minimumLeanMass),
    minimumMuscleMass: toNumberOrNull(payload.minimumMuscleMass),
    goalLeanMass: toNumberOrNull(payload.goalLeanMass),
    goalMuscleMass: toNumberOrNull(payload.goalMuscleMass),
    targetDate: payload.targetDate ?? null,
  };
}

export function assertGoalAllowedForProfile(profile) {
  const ageGroup = deriveAgeGroup({ dateOfBirth: profile?.dateOfBirth ?? null, age: profile?.age ?? null });
  if (ageGroup === 'child') {
    const error = new Error('Cut phases are not available for child profiles.');
    error.status = 403;
    throw error;
  }
}

export function getLatestBodyCompositionSnapshot({ weightLogs = [], healthMetrics = [] }) {
  const latestWeight = getLatestBy(weightLogs, 'date');
  const latestMetric = getLatestBy(healthMetrics, 'recordedAt');

  const weight = toNumberOrNull(latestMetric?.weight) ?? toNumberOrNull(latestWeight?.weight);
  const bodyFatPercent = toNumberOrNull(latestMetric?.bodyFatPercent);
  const muscleMass = toNumberOrNull(latestMetric?.muscleMass);
  const leanMass = toNumberOrNull(latestMetric?.fatFreeBodyWeight) ?? calculateLeanMass(weight, bodyFatPercent);
  const fatMass = calculateFatMass(weight, bodyFatPercent);
  const recordedAt = latestMetric?.recordedAt ?? (latestWeight?.date ? `${latestWeight.date}T00:00:00` : null);

  if (recordedAt == null || [weight, bodyFatPercent, muscleMass, leanMass].every((value) => value == null)) {
    return null;
  }

  return {
    recordedAt,
    weight,
    bodyFatPercent,
    fatMass,
    leanMass,
    muscleMass,
  };
}

export function buildGoalBaseline(snapshot) {
  if (!snapshot?.recordedAt) return null;
  return {
    baselineRecordedAt: snapshot.recordedAt,
    baselineWeight: snapshot.weight,
    baselineBodyFatPercent: snapshot.bodyFatPercent,
    baselineFatMass: snapshot.fatMass,
    baselineLeanMass: snapshot.leanMass,
    baselineMuscleMass: snapshot.muscleMass,
  };
}

export function buildCompletionSnapshot(snapshot) {
  if (!snapshot?.recordedAt) return null;
  return {
    completionRecordedAt: snapshot.recordedAt,
    completionWeight: snapshot.weight,
    completionBodyFatPercent: snapshot.bodyFatPercent,
    completionFatMass: snapshot.fatMass,
    completionLeanMass: snapshot.leanMass,
    completionMuscleMass: snapshot.muscleMass,
  };
}

function getGoalSnapshot(goal, currentSnapshot) {
  if (goal?.completionRecordedAt) {
    return {
      recordedAt: goal.completionRecordedAt,
      weight: goal.completionWeight,
      bodyFatPercent: goal.completionBodyFatPercent,
      fatMass: goal.completionFatMass,
      leanMass: goal.completionLeanMass,
      muscleMass: goal.completionMuscleMass,
    };
  }
  return currentSnapshot;
}

function hasReachedBodyFatGoal(goal, currentBodyFatPercent) {
  const current = toNumberOrNull(currentBodyFatPercent);
  if (current == null) return null;
  if (goal.targetBodyFatMin != null && goal.targetBodyFatMax != null) {
    return current >= goal.targetBodyFatMin && current <= goal.targetBodyFatMax;
  }
  if (goal.goalBodyFatPercent != null) return current <= goal.goalBodyFatPercent;
  if (goal.targetBodyFatMax != null) return current <= goal.targetBodyFatMax;
  if (goal.targetBodyFatMin != null) return current >= goal.targetBodyFatMin;
  return null;
}

function calculateProgressPercent(start, current, target, { inverse = true } = {}) {
  const numericStart = toNumberOrNull(start);
  const numericCurrent = toNumberOrNull(current);
  const numericTarget = toNumberOrNull(target);
  if (numericStart == null || numericCurrent == null || numericTarget == null) return null;
  const totalDelta = inverse ? numericStart - numericTarget : numericTarget - numericStart;
  if (!Number.isFinite(totalDelta) || totalDelta <= 0) return null;
  const currentDelta = inverse ? numericStart - numericCurrent : numericCurrent - numericStart;
  if (!Number.isFinite(currentDelta)) return null;
  return round(Math.max(0, Math.min(100, (currentDelta / totalDelta) * 100)), 1);
}

function deriveStatus(goal, progress) {
  const warnings = [];
  let summary = 'Progress is aligned with body composition goals.';

  if (goal.minimumLeanMass != null && progress.currentLeanMass != null) {
    if (progress.currentLeanMass < goal.minimumLeanMass) {
      warnings.push('Lean mass is below the configured floor.');
    } else if (progress.currentLeanMass <= goal.minimumLeanMass + WARNING_BAND_KG) {
      warnings.push('Lean mass is close to the configured floor.');
    }
  }

  if (goal.minimumMuscleMass != null && progress.currentMuscleMass != null) {
    if (progress.currentMuscleMass < goal.minimumMuscleMass) {
      warnings.push('Muscle mass is below the configured floor.');
    } else if (progress.currentMuscleMass <= goal.minimumMuscleMass + WARNING_BAND_KG) {
      warnings.push('Muscle mass is close to the configured floor.');
    }
  }

  if (progress.leanMassRetentionPercent != null) {
    if (progress.leanMassRetentionPercent < RETENTION_ALERT_PERCENT) {
      warnings.push('Lean mass retention has fallen below the preferred threshold.');
    } else if (progress.leanMassRetentionPercent < RETENTION_WATCH_PERCENT) {
      warnings.push('Lean mass retention is trending down and should be watched.');
    }
  }

  let overall = BODY_COMPOSITION_STATUS.GREEN;
  if (warnings.some((warning) => warning.includes('below'))) {
    overall = BODY_COMPOSITION_STATUS.RED;
    summary = 'Lean or muscle mass loss is too aggressive for this phase.';
  } else if (warnings.length > 0) {
    overall = BODY_COMPOSITION_STATUS.YELLOW;
    summary = 'Progress is moving, but lean-mass preservation needs attention.';
  }

  return { overall, warnings, summary };
}

function estimateCompletionDate(goal, entries) {
  if (!goal.targetDate || entries.length < MIN_ESTIMATE_ENTRIES) return null;
  const ordered = [...entries]
    .filter((entry) => entry.date && toNumberOrNull(entry.weight) != null)
    .sort((a, b) => (toDateMs(a.date) ?? 0) - (toDateMs(b.date) ?? 0));

  if (ordered.length < MIN_ESTIMATE_ENTRIES) return null;

  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  const spanMs = (toDateMs(last.date) ?? 0) - (toDateMs(first.date) ?? 0);
  const spanDays = spanMs / (24 * 60 * 60 * 1000);
  if (!Number.isFinite(spanDays) || spanDays < MIN_ESTIMATE_DAYS) return null;
  if (goal.goalWeight == null) return null;

  const weightDelta = toNumberOrNull(first.weight) - toNumberOrNull(last.weight);
  if (!Number.isFinite(weightDelta) || weightDelta <= 0) return null;

  const remaining = toNumberOrNull(last.weight) - goal.goalWeight;
  if (!Number.isFinite(remaining) || remaining <= 0) return null;

  const dailyLoss = weightDelta / spanDays;
  const daysRemaining = Math.ceil(remaining / dailyLoss);
  return addDays(last.date, daysRemaining);
}

export function calculateBodyCompositionProgress(goal, currentSnapshot) {
  const currentWeight = currentSnapshot?.weight ?? null;
  const currentBodyFatPercent = currentSnapshot?.bodyFatPercent ?? null;
  const currentFatMass = currentSnapshot?.fatMass ?? null;
  const currentLeanMass = currentSnapshot?.leanMass ?? null;
  const currentMuscleMass = currentSnapshot?.muscleMass ?? null;

  const remainingWeightToGoal = goal.goalWeight != null && currentWeight != null
    ? round(currentWeight - goal.goalWeight, 1)
    : null;
  const remainingFatToLose = goal.goalBodyFatPercent != null && currentFatMass != null && currentWeight != null
    ? round(currentFatMass - (currentWeight * (goal.goalBodyFatPercent / 100)), 1)
    : null;
  const leanMassChangeSinceStart = currentLeanMass != null && goal.baselineLeanMass != null
    ? round(currentLeanMass - goal.baselineLeanMass, 1)
    : null;
  const muscleMassChangeSinceStart = currentMuscleMass != null && goal.baselineMuscleMass != null
    ? round(currentMuscleMass - goal.baselineMuscleMass, 1)
    : null;
  const leanMassRetentionPercent = currentLeanMass != null && goal.baselineLeanMass != null && goal.baselineLeanMass > 0
    ? round((currentLeanMass / goal.baselineLeanMass) * 100, 1)
    : null;
  const muscleMassRetentionPercent = currentMuscleMass != null && goal.baselineMuscleMass != null && goal.baselineMuscleMass > 0
    ? round((currentMuscleMass / goal.baselineMuscleMass) * 100, 1)
    : null;

  const bodyFatGoalReached = hasReachedBodyFatGoal(goal, currentBodyFatPercent);
  const weightGoalReached = goal.goalWeight != null && currentWeight != null ? currentWeight <= goal.goalWeight : null;
  const leanMassFloorMaintained = goal.minimumLeanMass != null && currentLeanMass != null
    ? currentLeanMass >= goal.minimumLeanMass
    : null;
  const muscleMassFloorMaintained = goal.minimumMuscleMass != null && currentMuscleMass != null
    ? currentMuscleMass >= goal.minimumMuscleMass
    : null;
  const weightProgressPercent = calculateProgressPercent(goal.baselineWeight, currentWeight, goal.goalWeight, { inverse: true });
  const bodyFatProgressPercent = goal.goalBodyFatPercent != null
    ? calculateProgressPercent(goal.baselineBodyFatPercent, currentBodyFatPercent, goal.goalBodyFatPercent, { inverse: true })
    : goal.targetBodyFatMax != null
      ? calculateProgressPercent(goal.baselineBodyFatPercent, currentBodyFatPercent, goal.targetBodyFatMax, { inverse: true })
      : null;
  const leanMassRetentionScore = leanMassRetentionPercent == null ? null : round(Math.max(0, Math.min(100, leanMassRetentionPercent)), 1);
  const musclePreservationScore = muscleMassRetentionPercent == null ? null : round(Math.max(0, Math.min(100, muscleMassRetentionPercent)), 1);

  return {
    currentWeight,
    currentBodyFatPercent,
    currentFatMass,
    currentLeanMass,
    currentMuscleMass,
    remainingWeightToGoal,
    remainingFatToLose,
    leanMassChangeSinceStart,
    muscleMassChangeSinceStart,
    leanMassRetentionPercent,
    muscleMassRetentionPercent,
    weightProgressPercent,
    bodyFatProgressPercent,
    leanMassRetentionScore,
    musclePreservationScore,
    weightGoalReached,
    bodyFatGoalReached,
    leanMassFloorMaintained,
    muscleMassFloorMaintained,
  };
}

export function decorateGoalWithProgress(goal, currentSnapshot, weightEntries = []) {
  const displaySnapshot = getGoalSnapshot(goal, currentSnapshot);
  const progress = calculateBodyCompositionProgress(goal, displaySnapshot);
  const status = deriveStatus(goal, progress);
  const estimatedCompletionDate = goal.completedAt || goal.archivedAt ? null : estimateCompletionDate(goal, weightEntries);
  const isIdealSuccess = Boolean(
    (progress.weightGoalReached ?? true)
    && (progress.bodyFatGoalReached ?? true)
    && (progress.leanMassFloorMaintained ?? true)
    && (progress.muscleMassFloorMaintained ?? true)
  );
  const completedWithWarnings = Boolean(goal.completedAt && !isIdealSuccess);

  return {
    ...goal,
    baseline: {
      recordedAt: goal.baselineRecordedAt,
      weight: goal.baselineWeight,
      bodyFatPercent: goal.baselineBodyFatPercent,
      fatMass: goal.baselineFatMass,
      leanMass: goal.baselineLeanMass,
      muscleMass: goal.baselineMuscleMass,
    },
    current: displaySnapshot,
    progress,
    status,
    estimatedCompletionDate,
    estimatedCompletionLabel: estimatedCompletionDate ? 'Estimated based on recent trend' : null,
    isIdealSuccess,
    completedWithWarnings,
  };
}
