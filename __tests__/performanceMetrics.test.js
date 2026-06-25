import { describe, expect, it } from 'vitest';
import {
  buildPerformanceTrendGroups,
  convertPerformanceMetricValueFromCanonical,
  formatPerformanceMetricValue,
  formatPerformanceMetricRow,
  getPerformanceMetricDisplayUnit,
  getPerformanceMetricInputProps,
  getPerformanceMetricMeta,
  normalizePerformanceMetricInput,
  validatePerformanceMetricEntry,
} from '@/lib/performanceMetrics.js';

describe('performance metric unit helpers', () => {
  it('uses profile units for supported mass metrics', () => {
    expect(getPerformanceMetricDisplayUnit('bench_press', 'imperial')).toBe('lb');
    expect(getPerformanceMetricDisplayUnit('sprint_40_yard', 'imperial')).toBe('sec');
  });

  it('normalizes imperial entry values into canonical storage units', () => {
    const normalized = normalizePerformanceMetricInput({
      metricKey: 'bench_press',
      recordedAt: '2026-06-24T07:00',
      value: 225,
      reps: 5,
      note: 'Top set',
    }, 'imperial');

    expect(normalized.value).toBeCloseTo(102.1, 1);
    expect(normalized.reps).toBe(5);
    expect(normalized.unit).toBe('kg');
    expect(normalized.date).toBe('2026-06-24');
  });

  it('formats canonical metric values back into profile display units', () => {
    expect(convertPerformanceMetricValueFromCanonical('vertical_jump', 76.2, 'imperial')).toBeCloseTo(30, 1);
    expect(formatPerformanceMetricValue('throwing_distance', 36.58, 'imperial')).toBe('40 yd');
  });

  it('handles unsupported metric lookups defensively', () => {
    expect(getPerformanceMetricDisplayUnit('unknown_metric', 'imperial')).toBe('');
    expect(getPerformanceMetricMeta('unknown_metric', 'metric')).toBeNull();
    expect(convertPerformanceMetricValueFromCanonical('unknown_metric', 10, 'metric')).toBeNull();
  });

  it('returns input metadata for time, distance, and unknown metrics', () => {
    expect(getPerformanceMetricInputProps('sprint_40_yard')).toMatchObject({ step: '0.01', min: '0' });
    expect(getPerformanceMetricInputProps('throwing_distance')).toMatchObject({ step: '0.1', min: '0' });
    expect(getPerformanceMetricInputProps('unknown_metric')).toMatchObject({ step: '0.1', min: '0' });
  });
});

describe('validatePerformanceMetricEntry', () => {
  it('requires a supported metric, recordedAt, and positive numeric value', () => {
    const result = validatePerformanceMetricEntry({
      metricKey: 'mystery_metric',
      recordedAt: '',
      value: '0',
    }, 'metric');

    expect(result.errors).toContain('Select a supported performance metric.');
    expect(result.errors).toContain('Recorded At is required.');
    expect(result.errors).toContain('Value must be a positive number.');
  });

  it('rejects reps for unsupported performance metrics', () => {
    const result = validatePerformanceMetricEntry({
      metricKey: 'vertical_jump',
      recordedAt: '2026-06-24T07:00',
      value: '28',
      reps: '3',
    }, 'imperial');

    expect(result.errors).toContain('Reps are not supported for this performance metric.');
  });

  it('validates missing value and non-integer reps for supported lift metrics', () => {
    const result = validatePerformanceMetricEntry({
      metricKey: 'squat',
      recordedAt: '2026-06-24T07:00',
      value: '',
      reps: '2.5',
    }, 'metric');

    expect(result.errors).toContain('Value is required.');
    expect(result.errors).toContain('Reps must be a positive whole number.');
  });
});

describe('buildPerformanceTrendGroups', () => {
  it('groups, sorts, and computes latest/best/deltas per metric', () => {
    const groups = buildPerformanceTrendGroups([
      {
        id: 1,
        metricKey: 'bench_press',
        category: 'strength',
        recordedAt: '2026-06-01T07:00',
        date: '2026-06-01',
        value: 97.5,
        unit: 'kg',
        reps: 5,
        note: null,
      },
      {
        id: 2,
        metricKey: 'bench_press',
        category: 'strength',
        recordedAt: '2026-06-20T07:00',
        date: '2026-06-20',
        value: 102.1,
        unit: 'kg',
        reps: 5,
        note: 'PR',
      },
      {
        id: 3,
        metricKey: 'sprint_40_yard',
        category: 'speed',
        recordedAt: '2026-06-15T07:00',
        date: '2026-06-15',
        value: 4.82,
        unit: 'sec',
        reps: null,
        note: null,
      },
      {
        id: 4,
        metricKey: 'sprint_40_yard',
        category: 'speed',
        recordedAt: '2026-06-22T07:00',
        date: '2026-06-22',
        value: 4.71,
        unit: 'sec',
        reps: null,
        note: 'Hand timed',
      },
    ], 'imperial');

    expect(groups).toHaveLength(2);

    const bench = groups.find((group) => group.key === 'bench_press');
    expect(bench.latest.displayValueLabel).toBe('225.1 lb');
    expect(bench.best.displayValueLabel).toBe('225.1 lb');
    expect(bench.deltaSincePrevious).toBeCloseTo(10.1, 1);

    const sprint = groups.find((group) => group.key === 'sprint_40_yard');
    expect(sprint.best.displayValueLabel).toBe('4.71 sec');
    expect(sprint.deltaSincePrevious).toBeCloseTo(-0.11, 2);
    expect(sprint.chartRows.map((row) => row.displayDate)).toEqual([
      'Mon, Jun 15, 2026',
      'Mon, Jun 22, 2026',
    ]);
  });

  it('ignores invalid entries and preserves fallback row labels when metric metadata is missing', () => {
    const groups = buildPerformanceTrendGroups([
      { id: 1, metricKey: null, value: 100, recordedAt: '2026-06-01T07:00', date: '2026-06-01' },
      { id: 2, metricKey: 'unknown_metric', value: 100, recordedAt: '2026-06-01T07:00', date: '2026-06-01' },
      { id: 3, metricKey: 'vertical_jump', value: Number.NaN, recordedAt: '2026-06-02T07:00', date: '2026-06-02' },
    ], 'metric');

    expect(groups).toEqual([]);

    const fallback = formatPerformanceMetricRow({
      id: 9,
      metricKey: 'unknown_metric',
      category: 'custom',
      value: 12,
      note: null,
    }, 'metric');

    expect(fallback.label).toBe('unknown_metric');
    expect(fallback.categoryLabel).toBe('custom');
    expect(fallback.displayUnit).toBe('');
    expect(fallback.displayValueLabel).toBe('—');
  });
});
