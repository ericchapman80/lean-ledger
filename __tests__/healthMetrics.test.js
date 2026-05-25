import { describe, expect, it } from 'vitest';
import {
  getHealthMetricDisplayValue,
  getHealthMetricFieldMeta,
  getHealthMetricInputProps,
  inferColumnMapping,
  mapCsvRows,
  normalizeHealthMetricEntry,
  parseCsvText,
  validateHealthMetricEntry,
} from '@/lib/healthMetrics.js';

describe('parseCsvText', () => {
  it('parses headers and rows from csv text', () => {
    const parsed = parseCsvText('Date,Weight,Body Fat %\n2026-05-24T07:00,100,24.5');
    expect(parsed.headers).toEqual(['Date', 'Weight', 'Body Fat %']);
    expect(parsed.rows[0].Weight).toBe('100');
  });
});

describe('inferColumnMapping', () => {
  it('infers supported column targets from csv headers', () => {
    expect(inferColumnMapping(['Date', 'Weight', 'Body Fat %'])).toEqual({
      Date: 'recordedAt',
      Weight: 'weight',
      'Body Fat %': 'bodyFatPercent',
    });
  });

  it('infers supported column targets when headers include units', () => {
    expect(inferColumnMapping(['Date', 'Weight (lb)', 'Muscle Mass (lb)'])).toEqual({
      Date: 'recordedAt',
      'Weight (lb)': 'weight',
      'Muscle Mass (lb)': 'muscleMass',
    });
  });
});

describe('validateHealthMetricEntry', () => {
  it('requires a datetime and numeric metric values', () => {
    const result = validateHealthMetricEntry({ recordedAt: '', weight: 'abc' });
    expect(result.errors).toContain('Recorded at is required');
    expect(result.errors).toContain('Weight must be numeric');
  });

  it('validates core Lean Recomp ranges and boolean values', () => {
    const result = validateHealthMetricEntry({
      recordedAt: '2026-05-24T20:00',
      waistMeasurement: 19,
      hydrationOunces: 301,
      sleepHours: 17,
      energyLevel: 6,
      hungerLevel: 0,
      sorenessLevel: 9,
      workoutCompleted: 'maybe',
    });

    expect(result.errors).toContain('Waist must be between 20 and 80 inches');
    expect(result.errors).toContain('Hydration must be between 0 and 300 ounces');
    expect(result.errors).toContain('Sleep Hours must be between 0 and 16');
    expect(result.errors).toContain('Energy Level must be between 1 and 5');
    expect(result.errors).toContain('Hunger Level must be between 1 and 5');
    expect(result.errors).toContain('Soreness Level must be between 1 and 5');
    expect(result.errors).toContain('Workout Completed must be true or false');
  });

  it('uses imperial display ranges for manual entry when requested', () => {
    const result = validateHealthMetricEntry({
      recordedAt: '2026-05-24T20:00',
      weight: 43,
      waistMeasurement: 19,
    }, {
      units: 'imperial',
      inputMode: 'display',
    });

    expect(result.errors).toContain('Weight must be between 44 and 880 lb');
    expect(result.errors).toContain('Waist must be between 20 and 80 inches');
  });

  it('accepts optional core check-in and progress photo metadata without advanced metrics', () => {
    const result = validateHealthMetricEntry({
      recordedAt: '2026-05-24T20:00',
      workoutCompleted: false,
      progressPhotoCount: 2,
      progressPhotoNote: 'Front and side',
    });

    expect(result.errors).toEqual([]);
    expect(result.normalized.workoutCompleted).toBe(false);
    expect(result.normalized.progressPhotoCount).toBe(2);
    expect(result.normalized.progressPhotoNote).toBe('Front and side');
  });
});

describe('unit-aware health metric helpers', () => {
  it('returns imperial display metadata for mass fields', () => {
    expect(getHealthMetricFieldMeta('weight', 'imperial').unit).toBe('lb');
    expect(getHealthMetricFieldMeta('muscleMass', 'imperial').unit).toBe('lb');
  });

  it('returns metric display metadata for mass fields', () => {
    expect(getHealthMetricFieldMeta('weight', 'metric').unit).toBe('kg');
    expect(getHealthMetricFieldMeta('waistMeasurement', 'metric').unit).toBe('cm');
  });

  it('normalizes imperial manual-entry values into canonical storage units', () => {
    const normalized = normalizeHealthMetricEntry({
      recordedAt: '2026-05-24T20:00',
      weight: 165.3,
      muscleMass: 88.2,
      waistMeasurement: 32,
    }, {
      units: 'imperial',
      inputMode: 'display',
    });

    expect(normalized.weight).toBeCloseTo(75, 1);
    expect(normalized.muscleMass).toBeCloseTo(40, 1);
    expect(normalized.waistMeasurement).toBeCloseTo(32, 1);
  });

  it('normalizes metric waist display values into canonical stored inches', () => {
    const normalized = normalizeHealthMetricEntry({
      recordedAt: '2026-05-24T20:00',
      waistMeasurement: 81.3,
    }, {
      units: 'metric',
      inputMode: 'display',
    });

    expect(normalized.waistMeasurement).toBeCloseTo(32, 1);
  });

  it('renders stored canonical values using imperial display units', () => {
    expect(getHealthMetricDisplayValue('weight', 75, 'imperial')).toBeCloseTo(165.3, 1);
    expect(getHealthMetricDisplayValue('muscleMass', 40, 'imperial')).toBeCloseTo(88.2, 1);
    expect(getHealthMetricDisplayValue('waistMeasurement', 32, 'metric')).toBeCloseTo(81.3, 1);
  });

  it('exposes unit-aware input limits for profile preference propagation', () => {
    expect(getHealthMetricInputProps('weight', 'imperial')).toMatchObject({ min: 44, max: 880, step: '0.1' });
    expect(getHealthMetricInputProps('waistMeasurement', 'metric')).toMatchObject({ min: 50.8, max: 203.2, step: '0.1' });
  });
});

describe('mapCsvRows', () => {
  it('maps rows, validates numeric values, and flags duplicate datetimes', () => {
    const rows = [
      { Date: '2026-05-24T07:00', Weight: '100', 'Body Fat %': '25.1' },
      { Date: '2026-05-24T07:00', Weight: 'oops', 'Body Fat %': '24.8' },
    ];
    const mapped = mapCsvRows(rows, {
      Date: 'recordedAt',
      Weight: 'weight',
      'Body Fat %': 'bodyFatPercent',
    });

    expect(mapped[0].valid).toBe(true);
    expect(mapped[0].mapped.weight).toBe(100);
    expect(mapped[1].valid).toBe(false);
    expect(mapped[1].errors).toContain('Weight must be numeric');
    expect(mapped[1].errors).toContain('Duplicate recorded at value in this file');
  });

  it('converts csv values when a header includes imperial units', () => {
    const rows = [
      { Date: '2026-05-24T07:00', 'Weight (lb)': '165.3', 'Muscle Mass (lb)': '88.2' },
    ];
    const mapped = mapCsvRows(rows, {
      Date: 'recordedAt',
      'Weight (lb)': 'weight',
      'Muscle Mass (lb)': 'muscleMass',
    });

    expect(mapped[0].valid).toBe(true);
    expect(mapped[0].mapped.weight).toBeCloseTo(75, 1);
    expect(mapped[0].mapped.muscleMass).toBeCloseTo(40, 1);
  });
});
