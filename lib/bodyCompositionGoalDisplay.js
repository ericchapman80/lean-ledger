import { formatDisplayDate } from './utils/dateUtils.js';
import { formatDisplayWeightValue, getWeightDisplayValue, lbsToKg } from './utils/unitUtils.js';

function toNumberOrNull(value) {
  if (value === '' || value == null) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function round(value, precision = 1) {
  if (!Number.isFinite(Number(value))) return null;
  const factor = 10 ** precision;
  return Math.round(Number(value) * factor) / factor;
}

export function formatGoalMass(kg, units = 'metric') {
  if (kg == null) return '—';
  const displayValue = getWeightDisplayValue(kg, units);
  return displayValue == null ? '—' : formatDisplayWeightValue(displayValue, units);
}

export function formatGoalPercent(value) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  return `${round(value, 1)}%`;
}

export function formatBodyFatTarget(goal) {
  if (goal?.targetBodyFatMin != null && goal?.targetBodyFatMax != null) {
    if (goal.targetBodyFatMin === goal.targetBodyFatMax) return formatGoalPercent(goal.targetBodyFatMin);
    return `${formatGoalPercent(goal.targetBodyFatMin)}–${formatGoalPercent(goal.targetBodyFatMax)}`;
  }
  if (goal?.goalBodyFatPercent != null) return formatGoalPercent(goal.goalBodyFatPercent);
  if (goal?.targetBodyFatMax != null) return `≤ ${formatGoalPercent(goal.targetBodyFatMax)}`;
  if (goal?.targetBodyFatMin != null) return `≥ ${formatGoalPercent(goal.targetBodyFatMin)}`;
  return '—';
}

export function getBodyCompositionGoalForm(goal, units = 'metric') {
  return {
    name: goal?.name ?? 'Project 200',
    goalWeight: goal?.goalWeight != null ? String(getWeightDisplayValue(goal.goalWeight, units)) : '',
    goalBodyFatPercent: goal?.goalBodyFatPercent != null ? String(goal.goalBodyFatPercent) : '',
    targetBodyFatMin: goal?.targetBodyFatMin != null ? String(goal.targetBodyFatMin) : '',
    targetBodyFatMax: goal?.targetBodyFatMax != null ? String(goal.targetBodyFatMax) : '',
    minimumLeanMass: goal?.minimumLeanMass != null ? String(getWeightDisplayValue(goal.minimumLeanMass, units)) : '',
    minimumMuscleMass: goal?.minimumMuscleMass != null ? String(getWeightDisplayValue(goal.minimumMuscleMass, units)) : '',
    targetDate: goal?.targetDate ?? '',
  };
}

export function buildBodyCompositionGoalPayload(form, units = 'metric') {
  const toCanonicalMass = (value) => {
    const numeric = toNumberOrNull(value);
    if (numeric == null) return null;
    return units === 'imperial' ? lbsToKg(numeric) : round(numeric, 1);
  };

  return {
    name: form.name?.trim() || 'Cut Phase',
    phaseType: 'cut',
    goalWeight: toCanonicalMass(form.goalWeight),
    goalBodyFatPercent: toNumberOrNull(form.goalBodyFatPercent),
    targetBodyFatMin: toNumberOrNull(form.targetBodyFatMin),
    targetBodyFatMax: toNumberOrNull(form.targetBodyFatMax),
    minimumLeanMass: toCanonicalMass(form.minimumLeanMass),
    minimumMuscleMass: toCanonicalMass(form.minimumMuscleMass),
    targetDate: form.targetDate || null,
  };
}

export function getBodyCompositionStatusMeta(status) {
  switch (status) {
    case 'green':
      return {
        label: 'On track',
        color: 'var(--feedback-positive-text, #1f7a1f)',
        background: 'var(--feedback-positive-surface)',
        border: 'var(--feedback-positive-border)',
      };
    case 'red':
      return {
        label: 'Needs attention',
        color: 'var(--warning-color)',
        background: 'var(--warning-surface)',
        border: 'var(--warning-color)',
      };
    default:
      return {
        label: 'Watch',
        color: 'var(--feedback-info-text, var(--primary-color))',
        background: 'var(--feedback-info-surface)',
        border: 'var(--feedback-info-border)',
      };
  }
}

export function formatGoalDate(date) {
  if (!date) return '—';
  return formatDisplayDate(date);
}
