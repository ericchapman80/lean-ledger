import { formatDisplayDate, formatDate } from '@/lib/utils/dateUtils.js';
import { cmToInches, inchesToCm, kgToLbs, lbsToKg } from '@/lib/utils/unitUtils.js';

export const PERFORMANCE_METRIC_DEFINITIONS = [
  {
    key: 'bench_press',
    label: 'Bench Press',
    category: 'strength',
    canonicalUnit: 'kg',
    displayUnits: { metric: 'kg', imperial: 'lb' },
    unitType: 'mass',
    supportsReps: true,
    betterDirection: 'up',
    color: '#c0392b',
  },
  {
    key: 'squat',
    label: 'Squat',
    category: 'strength',
    canonicalUnit: 'kg',
    displayUnits: { metric: 'kg', imperial: 'lb' },
    unitType: 'mass',
    supportsReps: true,
    betterDirection: 'up',
    color: '#8e44ad',
  },
  {
    key: 'deadlift',
    label: 'Deadlift',
    category: 'strength',
    canonicalUnit: 'kg',
    displayUnits: { metric: 'kg', imperial: 'lb' },
    unitType: 'mass',
    supportsReps: true,
    betterDirection: 'up',
    color: '#d35400',
  },
  {
    key: 'vertical_jump',
    label: 'Vertical Jump',
    category: 'power',
    canonicalUnit: 'cm',
    displayUnits: { metric: 'cm', imperial: 'in' },
    unitType: 'length',
    supportsReps: false,
    betterDirection: 'up',
    color: '#16a085',
  },
  {
    key: 'broad_jump',
    label: 'Broad Jump',
    category: 'power',
    canonicalUnit: 'cm',
    displayUnits: { metric: 'cm', imperial: 'in' },
    unitType: 'length',
    supportsReps: false,
    betterDirection: 'up',
    color: '#27ae60',
  },
  {
    key: 'sprint_40_yard',
    label: '40-Yard Dash',
    category: 'speed',
    canonicalUnit: 'sec',
    displayUnits: { metric: 'sec', imperial: 'sec' },
    unitType: 'time',
    supportsReps: false,
    betterDirection: 'down',
    color: '#1f6feb',
  },
  {
    key: 'sprint_100m',
    label: '100m Sprint',
    category: 'speed',
    canonicalUnit: 'sec',
    displayUnits: { metric: 'sec', imperial: 'sec' },
    unitType: 'time',
    supportsReps: false,
    betterDirection: 'down',
    color: '#2980b9',
  },
  {
    key: 'throwing_distance',
    label: 'Throwing Distance',
    category: 'sport',
    canonicalUnit: 'm',
    displayUnits: { metric: 'm', imperial: 'yd' },
    unitType: 'distance',
    supportsReps: false,
    betterDirection: 'up',
    color: '#f39c12',
  },
];

const PERFORMANCE_METRIC_MAP = Object.fromEntries(PERFORMANCE_METRIC_DEFINITIONS.map((metric) => [metric.key, metric]));

const CATEGORY_LABELS = {
  strength: 'Strength',
  power: 'Power',
  speed: 'Speed',
  sport: 'Sport',
};

function round(value, precision = 1) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function metersToYards(value) {
  return round(value * 1.09361, 1);
}

function yardsToMeters(value) {
  return round(value / 1.09361, 2);
}

export function getPerformanceMetricDefinition(metricKey) {
  return PERFORMANCE_METRIC_MAP[metricKey] || null;
}

export function getPerformanceMetricOptions() {
  return PERFORMANCE_METRIC_DEFINITIONS.map((definition) => ({
    key: definition.key,
    label: definition.label,
    category: definition.category,
    categoryLabel: CATEGORY_LABELS[definition.category] || definition.category,
  }));
}

export function getPerformanceMetricDisplayUnit(metricKey, units = 'metric') {
  const definition = getPerformanceMetricDefinition(metricKey);
  if (!definition) return '';
  return definition.displayUnits?.[units] || definition.canonicalUnit;
}

export function getPerformanceMetricMeta(metricKey, units = 'metric') {
  const definition = getPerformanceMetricDefinition(metricKey);
  if (!definition) return null;

  return {
    ...definition,
    categoryLabel: CATEGORY_LABELS[definition.category] || definition.category,
    displayUnit: getPerformanceMetricDisplayUnit(metricKey, units),
  };
}

export function convertPerformanceMetricValueToCanonical(metricKey, value, units = 'metric') {
  if (!Number.isFinite(Number(value))) return null;
  const definition = getPerformanceMetricDefinition(metricKey);
  if (!definition) return null;
  const numericValue = Number(value);

  if (definition.unitType === 'mass') {
    return units === 'imperial' ? lbsToKg(numericValue) : round(numericValue, 2);
  }
  if (definition.unitType === 'length') {
    return units === 'imperial' ? inchesToCm(numericValue) : round(numericValue, 1);
  }
  if (definition.unitType === 'distance') {
    return units === 'imperial' ? yardsToMeters(numericValue) : round(numericValue, 2);
  }

  return round(numericValue, 2);
}

export function convertPerformanceMetricValueFromCanonical(metricKey, value, units = 'metric') {
  if (!Number.isFinite(Number(value))) return null;
  const definition = getPerformanceMetricDefinition(metricKey);
  if (!definition) return null;
  const numericValue = Number(value);

  if (definition.unitType === 'mass') {
    return units === 'imperial' ? kgToLbs(numericValue) : round(numericValue, 1);
  }
  if (definition.unitType === 'length') {
    return units === 'imperial' ? cmToInches(numericValue) : round(numericValue, 1);
  }
  if (definition.unitType === 'distance') {
    return units === 'imperial' ? metersToYards(numericValue) : round(numericValue, 2);
  }

  return round(numericValue, 2);
}

export function formatPerformanceMetricValue(metricKey, value, units = 'metric') {
  const displayValue = convertPerformanceMetricValueFromCanonical(metricKey, value, units);
  if (displayValue == null) return '—';
  const unit = getPerformanceMetricDisplayUnit(metricKey, units);
  return `${displayValue}${unit ? ` ${unit}` : ''}`;
}

export function getPerformanceMetricInputProps(metricKey) {
  const definition = getPerformanceMetricDefinition(metricKey);
  if (!definition) return { step: '0.1', min: '0' };
  if (definition.unitType === 'time') return { step: '0.01', min: '0' };
  if (definition.unitType === 'distance') return { step: '0.1', min: '0' };
  return { step: '0.1', min: '0' };
}

export function normalizePerformanceMetricInput(input, units = 'metric') {
  return {
    metricKey: input.metricKey,
    category: getPerformanceMetricDefinition(input.metricKey)?.category || null,
    recordedAt: input.recordedAt,
    date: formatDate(input.recordedAt),
    value: convertPerformanceMetricValueToCanonical(input.metricKey, input.value, units),
    unit: getPerformanceMetricDefinition(input.metricKey)?.canonicalUnit || null,
    reps: input.reps == null || input.reps === '' ? null : Number(input.reps),
    note: input.note?.trim() || null,
  };
}

export function validatePerformanceMetricEntry(input, units = 'metric') {
  const errors = [];
  const definition = getPerformanceMetricDefinition(input.metricKey);

  if (!definition) {
    errors.push('Select a supported performance metric.');
  }

  if (!input.recordedAt) {
    errors.push('Recorded At is required.');
  }

  if (input.value == null || input.value === '') {
    errors.push('Value is required.');
  } else if (!Number.isFinite(Number(input.value)) || Number(input.value) <= 0) {
    errors.push('Value must be a positive number.');
  }

  if (input.reps != null && input.reps !== '') {
    if (!definition?.supportsReps) {
      errors.push('Reps are not supported for this performance metric.');
    } else if (!Number.isInteger(Number(input.reps)) || Number(input.reps) <= 0) {
      errors.push('Reps must be a positive whole number.');
    }
  }

  const normalized = errors.length === 0
    ? normalizePerformanceMetricInput(input, units)
    : null;

  return { normalized, errors };
}

export function formatPerformanceMetricRow(row, units = 'metric') {
  const meta = getPerformanceMetricMeta(row.metricKey, units);
  const displayValue = convertPerformanceMetricValueFromCanonical(row.metricKey, row.value, units);
  return {
    ...row,
    label: meta?.label || row.metricKey,
    categoryLabel: meta?.categoryLabel || row.category,
    displayUnit: meta?.displayUnit || '',
    displayValue,
    displayValueLabel: formatPerformanceMetricValue(row.metricKey, row.value, units),
  };
}

function getBestEntry(entries, betterDirection) {
  if (entries.length === 0) return null;
  return entries.reduce((best, current) => {
    if (!best) return current;
    if (betterDirection === 'down') {
      return current.value < best.value ? current : best;
    }
    return current.value > best.value ? current : best;
  }, null);
}

export function buildPerformanceTrendGroups(entries, units = 'metric') {
  const byMetric = new Map();
  const sortedEntries = [...entries]
    .filter((entry) => entry?.metricKey && Number.isFinite(Number(entry?.value)))
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));

  for (const entry of sortedEntries) {
    const definition = getPerformanceMetricDefinition(entry.metricKey);
    if (!definition) continue;
    if (!byMetric.has(entry.metricKey)) byMetric.set(entry.metricKey, []);
    byMetric.get(entry.metricKey).push(entry);
  }

  return Array.from(byMetric.entries()).map(([metricKey, metricEntries]) => {
    const meta = getPerformanceMetricMeta(metricKey, units);
    const chartRows = metricEntries.map((entry) => ({
      id: entry.id,
      displayDate: formatDisplayDate(entry.date),
      value: convertPerformanceMetricValueFromCanonical(metricKey, entry.value, units),
      reps: entry.reps,
      note: entry.note,
    }));
    const latest = metricEntries[metricEntries.length - 1];
    const best = getBestEntry(metricEntries, meta.betterDirection);
    const previous = metricEntries.length > 1 ? metricEntries[metricEntries.length - 2] : null;
    const latestDisplayValue = convertPerformanceMetricValueFromCanonical(metricKey, latest?.value, units);
    const previousDisplayValue = convertPerformanceMetricValueFromCanonical(metricKey, previous?.value, units);
    const delta = latestDisplayValue != null && previousDisplayValue != null
      ? round(latestDisplayValue - previousDisplayValue, meta.unitType === 'time' ? 2 : 1)
      : null;

    return {
      key: metricKey,
      label: meta.label,
      category: meta.category,
      categoryLabel: meta.categoryLabel,
      displayUnit: meta.displayUnit,
      betterDirection: meta.betterDirection,
      supportsReps: meta.supportsReps,
      color: meta.color,
      entries: metricEntries.map((entry) => formatPerformanceMetricRow(entry, units)),
      chartRows,
      latest: latest ? formatPerformanceMetricRow(latest, units) : null,
      best: best ? formatPerformanceMetricRow(best, units) : null,
      deltaSincePrevious: delta,
      totalEntries: metricEntries.length,
    };
  });
}
