import { describe, expect, it } from 'vitest';
import { buildPerformanceReadiness, buildPerformanceSummary } from '@/lib/performanceSummary.js';

describe('buildPerformanceReadiness', () => {
  it('returns a green readiness state when sleep, energy, soreness, and hydration are supportive', () => {
    const readiness = buildPerformanceReadiness({
      sleepHours: 8,
      energyLevel: 4,
      sorenessLevel: 2,
      hydrationOunces: 120,
    }, 110);

    expect(readiness.score).toBeGreaterThanOrEqual(85);
    expect(readiness.status.key).toBe('green');
    expect(readiness.signals).toHaveLength(4);
  });

  it('returns recover when the latest check-in has weak recovery signals', () => {
    const readiness = buildPerformanceReadiness({
      sleepHours: 4.5,
      energyLevel: 2,
      sorenessLevel: 5,
      hydrationOunces: 24,
    }, 96);

    expect(readiness.status.key).toBe('red');
    expect(readiness.lowestSignal.key).toBe('hydration');
  });
});

describe('buildPerformanceSummary', () => {
  it('summarizes readiness, momentum, and recent personal bests', () => {
    const summary = buildPerformanceSummary({
      performanceMetrics: [
        {
          id: 1,
          metricKey: 'bench_press',
          category: 'strength',
          recordedAt: '2026-06-10T07:00',
          date: '2026-06-10',
          value: 97.5,
          unit: 'kg',
          reps: 5,
          note: null,
        },
        {
          id: 2,
          metricKey: 'bench_press',
          category: 'strength',
          recordedAt: '2026-06-24T07:00',
          date: '2026-06-24',
          value: 102.5,
          unit: 'kg',
          reps: 5,
          note: 'PR',
        },
        {
          id: 3,
          metricKey: 'sprint_40_yard',
          category: 'speed',
          recordedAt: '2026-06-08T07:00',
          date: '2026-06-08',
          value: 4.83,
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
          value: 4.74,
          unit: 'sec',
          reps: null,
          note: null,
        },
      ],
      latestMetric: {
        sleepHours: 7.5,
        energyLevel: 4,
        sorenessLevel: 2,
        hydrationOunces: 110,
      },
      hydrationTarget: 100,
      referenceDate: '2026-06-25T12:00:00Z',
    });

    expect(summary.hasData).toBe(true);
    expect(summary.readiness.status.key).toBe('green');
    expect(summary.momentum.key).toBe('up');
    expect(summary.recentPersonalBests).toBeGreaterThanOrEqual(1);
    expect(summary.activeMetricsCount).toBe(2);
    expect(summary.topMetricLabel).toBeTruthy();
  });

  it('returns a useful empty baseline when no performance entries exist yet', () => {
    const summary = buildPerformanceSummary({
      performanceMetrics: [],
      latestMetric: null,
      hydrationTarget: null,
    });

    expect(summary.hasData).toBe(false);
    expect(summary.readiness.status.key).toBe('unknown');
    expect(summary.activeMetricsCount).toBe(0);
    expect(summary.momentum.key).toBe('steady');
  });
});
