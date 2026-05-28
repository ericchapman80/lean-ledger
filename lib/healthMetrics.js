import { formatDate } from '@/lib/utils/dateUtils.js';
import {
  cmToInches,
  flOzToMl,
  inchesToCm,
  kgToLbs,
  lbsToKg,
  mlToFlOz,
} from '@/lib/utils/unitUtils.js';

export const HEALTH_METRIC_FIELDS = [
  {
    key: 'weight',
    label: 'Weight',
    unit: 'kg',
    unitType: 'mass',
    displayUnits: { metric: 'kg', imperial: 'lb' },
    importable: true,
    core: true,
  },
  {
    key: 'waistMeasurement',
    label: 'Waist',
    unit: 'in',
    unitType: 'length',
    displayUnits: { metric: 'cm', imperial: 'in' },
    importable: false,
    core: true,
  },
  { key: 'workoutCompleted', label: 'Workout Completed', unit: '', importable: false, core: true, type: 'boolean' },
  {
    key: 'hydrationOunces',
    label: 'Hydration',
    unit: 'oz',
    unitType: 'volume',
    displayUnits: { metric: 'ml', imperial: 'oz' },
    importable: false,
    core: true,
  },
  { key: 'energyLevel', label: 'Energy Level', unit: '', importable: false, core: true },
  { key: 'hungerLevel', label: 'Hunger Level', unit: '', importable: false, core: true },
  { key: 'sorenessLevel', label: 'Soreness Level', unit: '', importable: false, core: true },
  { key: 'bmi', label: 'BMI', unit: '', importable: true },
  { key: 'bodyFatPercent', label: 'Body Fat %', unit: '%', importable: true },
  { key: 'skeletalMuscle', label: 'Skeletal Muscle', unit: '', importable: true },
  {
    key: 'muscleMass',
    label: 'Muscle Mass',
    unit: 'kg',
    unitType: 'mass',
    displayUnits: { metric: 'kg', imperial: 'lb' },
    importable: true,
  },
  { key: 'proteinPercent', label: 'Protein %', unit: '%', importable: true },
  { key: 'bmr', label: 'BMR', unit: 'kcal', importable: true },
  {
    key: 'fatFreeBodyWeight',
    label: 'Fat-Free Body Weight',
    unit: 'kg',
    unitType: 'mass',
    displayUnits: { metric: 'kg', imperial: 'lb' },
    importable: true,
  },
  { key: 'subcutaneousFatPercent', label: 'Subcutaneous Fat %', unit: '%', importable: true },
  { key: 'visceralFat', label: 'Visceral Fat', unit: '', importable: true },
  { key: 'bodyWaterPercent', label: 'Body Water %', unit: '%', importable: true },
  {
    key: 'boneMass',
    label: 'Bone Mass',
    unit: 'kg',
    unitType: 'mass',
    displayUnits: { metric: 'kg', imperial: 'lb' },
    importable: true,
  },
  { key: 'metabolicAge', label: 'Metabolic Age', unit: '', importable: true },
  { key: 'steps', label: 'Steps', unit: '', importable: false },
  { key: 'activeCalories', label: 'Active Calories', unit: 'kcal', importable: false },
  { key: 'restingHeartRate', label: 'Resting Heart Rate', unit: 'bpm', importable: false },
  { key: 'sleepHours', label: 'Sleep Hours', unit: 'hrs', importable: false },
  { key: 'hrv', label: 'HRV', unit: 'ms', importable: false },
  { key: 'progressPhotoCount', label: 'Progress Photo Count', unit: '', importable: false, type: 'integer' },
  { key: 'progressPhotoNote', label: 'Progress Photo Note', unit: '', importable: false, type: 'text' },
];

export const CSV_IMPORT_FIELDS = ['recordedAt', ...HEALTH_METRIC_FIELDS.filter((field) => field.importable).map((field) => field.key)];

export const CORE_CHECKIN_FIELDS = [
  'waistMeasurement',
  'workoutCompleted',
  'hydrationOunces',
  'sleepHours',
  'energyLevel',
  'hungerLevel',
  'sorenessLevel',
  'progressPhotoCount',
  'progressPhotoNote',
];

const NUMERIC_FIELDS = HEALTH_METRIC_FIELDS
  .filter((field) => field.type !== 'boolean' && field.type !== 'text')
  .map((field) => field.key);
const NUMERIC_FIELD_SET = new Set(NUMERIC_FIELDS);
const BOOLEAN_FIELDS = new Set(HEALTH_METRIC_FIELDS.filter((field) => field.type === 'boolean').map((field) => field.key));
const TEXT_FIELDS = new Set(HEALTH_METRIC_FIELDS.filter((field) => field.type === 'text').map((field) => field.key));
const FIELD_MAP = Object.fromEntries(HEALTH_METRIC_FIELDS.map((field) => [field.key, field]));

const FIELD_RANGES = {
  weight: {
    kg: { min: 20, max: 400, message: 'Weight must be between 20 and 400 kg' },
    lb: { min: 44, max: 880, message: 'Weight must be between 44 and 880 lb' },
  },
  waistMeasurement: {
    in: { min: 20, max: 80, message: 'Waist must be between 20 and 80 inches' },
    cm: { min: 50.8, max: 203.2, message: 'Waist must be between 50.8 and 203.2 cm' },
  },
  hydrationOunces: {
    oz: { min: 0, max: 300, message: 'Hydration must be between 0 and 300 ounces' },
    ml: { min: 0, max: 8872.1, message: 'Hydration must be between 0 and 8872.1 ml' },
  },
  sleepHours: { min: 0, max: 16, message: 'Sleep Hours must be between 0 and 16' },
  energyLevel: { min: 1, max: 5, integer: true, message: 'Energy Level must be between 1 and 5' },
  hungerLevel: { min: 1, max: 5, integer: true, message: 'Hunger Level must be between 1 and 5' },
  sorenessLevel: { min: 1, max: 5, integer: true, message: 'Soreness Level must be between 1 and 5' },
  progressPhotoCount: { min: 0, max: 20, integer: true, message: 'Progress Photo Count must be between 0 and 20' },
};

function normalizeHeader(header) {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const HEADER_ALIASES = {
  recordedat: 'recordedAt',
  timestamp: 'recordedAt',
  datetime: 'recordedAt',
  measuredat: 'recordedAt',
  date: 'recordedAt',
  time: 'ignore',
  bodyfat: 'bodyFatPercent',
  bodyfatpercent: 'bodyFatPercent',
  skeletalmuscle: 'skeletalMuscle',
  musclemass: 'muscleMass',
  proteinpercent: 'proteinPercent',
  fatfreebodyweight: 'fatFreeBodyWeight',
  subcutaneousfatpercent: 'subcutaneousFatPercent',
  visceralfat: 'visceralFat',
  bodywaterpercent: 'bodyWaterPercent',
  bonemass: 'boneMass',
  metabolicage: 'metabolicAge',
  activecalories: 'activeCalories',
  restingheartrate: 'restingHeartRate',
  sleephours: 'sleepHours',
};

function round(value, precision = 1) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function getFieldDefinition(fieldKey) {
  return FIELD_MAP[fieldKey];
}

function getDisplayUnit(fieldKey, units = 'metric') {
  const field = getFieldDefinition(fieldKey);
  return field?.displayUnits?.[units] || field?.unit || '';
}

function getInputUnit(fieldKey, { units = 'metric', inputMode = 'canonical', unitHints = {} } = {}) {
  if (unitHints[fieldKey]) return unitHints[fieldKey];
  return inputMode === 'display' ? getDisplayUnit(fieldKey, units) : getFieldDefinition(fieldKey)?.unit;
}

function convertValueToCanonical(fieldKey, value, inputUnit) {
  const field = getFieldDefinition(fieldKey);
  if (!field?.unitType || !Number.isFinite(value)) return value;

  switch (field.unitType) {
    case 'mass':
      return inputUnit === 'lb' ? lbsToKg(value) : value;
    case 'length':
      return inputUnit === 'cm' ? cmToInches(value) : value;
    case 'volume':
      if (inputUnit === 'ml') return mlToFlOz(value);
      if (inputUnit === 'l') return mlToFlOz(value * 1000);
      return value;
    default:
      return value;
  }
}

function convertValueFromCanonical(fieldKey, value, units = 'metric') {
  const displayUnit = getDisplayUnit(fieldKey, units);
  const field = getFieldDefinition(fieldKey);
  if (!field?.unitType || !Number.isFinite(value)) return value;

  switch (field.unitType) {
    case 'mass':
      return displayUnit === 'lb' ? kgToLbs(value) : round(value, 1);
    case 'length':
      return displayUnit === 'cm' ? inchesToCm(value) : round(value, 1);
    case 'volume':
      if (displayUnit === 'ml') return flOzToMl(value);
      if (displayUnit === 'l') return round(flOzToMl(value) / 1000, 2);
      return round(value, 1);
    default:
      return value;
  }
}

function getFieldRange(fieldKey, options = {}) {
  const range = FIELD_RANGES[fieldKey];
  if (!range) return null;
  if ('min' in range) return range;
  return range[getInputUnit(fieldKey, options)] || null;
}

function detectFieldUnitFromHeader(header, fieldKey) {
  const field = getFieldDefinition(fieldKey);
  if (!field?.unitType) return null;

  const normalized = header.toLowerCase();
  if (field.unitType === 'mass') {
    if (/\b(lb|lbs|pound|pounds)\b/.test(normalized)) return 'lb';
    if (/\b(kg|kilogram|kilograms)\b/.test(normalized)) return 'kg';
  }

  if (field.unitType === 'length') {
    if (/\b(cm|centimeter|centimeters)\b/.test(normalized)) return 'cm';
    if (/\b(in|inch|inches)\b/.test(normalized)) return 'in';
  }

  if (field.unitType === 'volume') {
    if (/\b(ml|milliliter|milliliters)\b/.test(normalized)) return 'ml';
    if (/\b(l|liter|liters)\b/.test(normalized)) return 'l';
    if (/\b(oz|ounce|ounces|fl oz|fluid ounce|fluid ounces)\b/.test(normalized)) return 'oz';
  }

  return null;
}

export function getHealthMetricFieldMeta(fieldKey, units = 'metric') {
  const field = getFieldDefinition(fieldKey);
  if (!field) return null;

  return {
    ...field,
    unit: getDisplayUnit(fieldKey, units),
  };
}

export function getHealthMetricInputProps(fieldKey, units = 'metric') {
  const range = getFieldRange(fieldKey, { units, inputMode: 'display' });
  const field = getFieldDefinition(fieldKey);

  return {
    step: field?.type === 'integer' ? '1' : '0.1',
    min: range?.min,
    max: range?.max,
  };
}

export function getHealthMetricDisplayValue(fieldKey, value, units = 'metric') {
  if (value == null || !Number.isFinite(Number(value))) return null;
  return convertValueFromCanonical(fieldKey, Number(value), units);
}

export function formatHealthMetricDisplayValue(fieldKey, value, units = 'metric') {
  const displayValue = getHealthMetricDisplayValue(fieldKey, value, units);
  if (displayValue == null) return '—';

  return formatHealthMetricDisplayUnitValue(fieldKey, displayValue, units);
}

export function formatHealthMetricDisplayUnitValue(fieldKey, value, units = 'metric') {
  if (value == null || !Number.isFinite(Number(value))) return '—';

  const unit = getDisplayUnit(fieldKey, units);
  const numericValue = Number(value);
  const formattedValue = Number.isInteger(numericValue)
    ? String(numericValue)
    : numericValue.toFixed(1);

  return unit ? `${formattedValue} ${unit}` : formattedValue;
}

export function inferColumnMapping(headers) {
  return headers.reduce((mapping, header) => {
    const normalized = normalizeHeader(header);
    const inferredField = HEALTH_METRIC_FIELDS.find((field) => (
      normalizeHeader(field.key) === normalized
      || normalizeHeader(field.label) === normalized
      || normalized.startsWith(normalizeHeader(field.key))
      || normalized.startsWith(normalizeHeader(field.label))
    ))?.key;
    mapping[header] = HEADER_ALIASES[normalized] || inferredField || 'ignore';
    return mapping;
  }, {});
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i++;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

export function parseCsvText(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce((acc, header, index) => {
      acc[header] = values[index] ?? '';
      return acc;
    }, {});
  });

  return { headers, rows };
}

export function normalizeHealthMetricEntry(input, options = {}) {
  const recordedAt = input.recordedAt
    ? input.recordedAt.replace(' ', 'T')
    : '';

  const normalized = {
    recordedAt,
    date: recordedAt ? formatDate(recordedAt) : '',
  };

  for (const field of NUMERIC_FIELDS) {
    const raw = input[field];
    if (raw === '' || raw == null) {
      normalized[field] = null;
      continue;
    }

    const numericValue = Number(raw);
    normalized[field] = Number.isFinite(numericValue)
      ? convertValueToCanonical(field, numericValue, getInputUnit(field, options))
      : numericValue;
  }

  for (const field of BOOLEAN_FIELDS) {
    const raw = input[field];
    if (raw === '' || raw == null) {
      normalized[field] = null;
    } else if (typeof raw === 'boolean') {
      normalized[field] = raw;
    } else {
      const stringValue = String(raw).toLowerCase();
      normalized[field] = ['true', '1', 'yes', 'on'].includes(stringValue)
        ? true
        : ['false', '0', 'no', 'off'].includes(stringValue)
          ? false
          : raw;
    }
  }

  for (const field of TEXT_FIELDS) {
    const raw = input[field];
    normalized[field] = raw == null || raw === '' ? null : String(raw).trim();
  }

  return normalized;
}

export function validateHealthMetricEntry(input, options = {}) {
  const normalized = normalizeHealthMetricEntry(input, options);
  const errors = [];

  if (!normalized.recordedAt) {
    errors.push('Recorded at is required');
  }

  const hasMetric = [
    ...NUMERIC_FIELDS,
    ...BOOLEAN_FIELDS,
    ...TEXT_FIELDS,
  ].some((field) => normalized[field] != null);
  if (!hasMetric) {
    errors.push('At least one metric is required');
  }

  for (const field of NUMERIC_FIELDS) {
    if (normalized[field] != null && !Number.isFinite(normalized[field])) {
      const label = HEALTH_METRIC_FIELDS.find((metric) => metric.key === field)?.label || field;
      errors.push(`${label} must be numeric`);
    }
  }

  for (const field of BOOLEAN_FIELDS) {
    if (normalized[field] != null && typeof normalized[field] !== 'boolean') {
      const label = HEALTH_METRIC_FIELDS.find((metric) => metric.key === field)?.label || field;
      errors.push(`${label} must be true or false`);
    }
  }

  for (const field of Object.keys(FIELD_RANGES)) {
    const range = getFieldRange(field, options);
    if (!range) continue;

    const rawValue = input[field];
    const valueForValidation = rawValue === '' || rawValue == null
      ? null
      : Number(rawValue);

    if (valueForValidation == null || !Number.isFinite(valueForValidation)) continue;
    if (range.integer && !Number.isInteger(valueForValidation)) {
      errors.push(range.message);
      continue;
    }
    if (valueForValidation < range.min || valueForValidation > range.max) {
      errors.push(range.message);
    }
  }

  return { normalized, errors };
}

export function mapCsvRows(rows, mapping, options = {}) {
  const seenRecordedAt = new Set();

  return rows.map((row, index) => {
    const input = {};
    const unitHints = {};

    for (const [header, target] of Object.entries(mapping)) {
      if (!target || target === 'ignore') continue;
      if (target === 'recordedAt') {
        input.recordedAt = row[header];
        continue;
      }
      if (NUMERIC_FIELD_SET.has(target)) {
        input[target] = row[header];
        const unitHint = detectFieldUnitFromHeader(header, target);
        if (unitHint) unitHints[target] = unitHint;
      }
    }

    const { normalized, errors } = validateHealthMetricEntry(input, {
      ...options,
      inputMode: 'canonical',
      unitHints,
    });
    if (normalized.recordedAt) {
      if (seenRecordedAt.has(normalized.recordedAt)) {
        errors.push('Duplicate recorded at value in this file');
      }
      seenRecordedAt.add(normalized.recordedAt);
    }

    return {
      rowNumber: index + 2,
      raw: row,
      mapped: normalized,
      errors,
      valid: errors.length === 0,
    };
  });
}

export function getAvailableAdvancedMetricGroups(entries) {
  const groups = [
    {
      key: 'bodyComposition',
      title: 'Body Composition Trends',
      fields: ['bodyFatPercent', 'skeletalMuscle', 'muscleMass', 'bodyWaterPercent'],
    },
    {
      key: 'metabolism',
      title: 'Metabolism Trends',
      fields: ['bmr', 'proteinPercent', 'fatFreeBodyWeight', 'metabolicAge'],
    },
    {
      key: 'recovery',
      title: 'Recovery Trends',
      fields: ['restingHeartRate', 'hrv'],
    },
    {
      key: 'activity',
      title: 'Activity Trends',
      fields: ['steps', 'activeCalories'],
    },
  ];

  return groups
    .map((group) => ({
      ...group,
      fields: group.fields.filter((field) => entries.some((entry) => entry[field] != null)),
    }))
    .filter((group) => group.fields.length > 0);
}
