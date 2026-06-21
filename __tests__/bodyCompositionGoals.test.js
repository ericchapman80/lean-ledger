import { describe, expect, it } from 'vitest';
import {
  buildGoalBaseline,
  calculateFatMass,
  calculateLeanMass,
  decorateGoalWithProgress,
  getLatestBodyCompositionSnapshot,
  validateBodyCompositionGoalPayload,
} from '@/lib/bodyCompositionGoals';

describe('body composition goal helpers', () => {
  it('calculates fat and lean mass from canonical weight/body fat values', () => {
    expect(calculateFatMass(97.6, 17.2)).toBeCloseTo(16.8, 1);
    expect(calculateLeanMass(97.6, 17.2)).toBeCloseTo(80.8, 1);
  });

  it('builds a latest snapshot from weight logs and health metrics', () => {
    const snapshot = getLatestBodyCompositionSnapshot({
      weightLogs: [{ date: '2026-06-20', weight: 97.6 }],
      healthMetrics: [{
        recordedAt: '2026-06-20T07:00:00',
        weight: 97.6,
        bodyFatPercent: 17.2,
        muscleMass: 76.8,
      }],
    });

    expect(snapshot).toMatchObject({
      recordedAt: '2026-06-20T07:00:00',
      weight: 97.6,
      bodyFatPercent: 17.2,
      leanMass: 80.8,
      muscleMass: 76.8,
    });
  });

  it('preserves a frozen baseline and computes progress/status', () => {
    const goal = {
      id: 1,
      profileId: 2,
      name: 'Project 200',
      phaseType: 'cut',
      goalWeight: 90.7,
      goalBodyFatPercent: 12,
      minimumLeanMass: 79.8,
      minimumMuscleMass: 76.2,
      targetDate: '2026-12-31',
      baselineRecordedAt: '2026-06-20T07:00:00',
      baselineWeight: 97.6,
      baselineBodyFatPercent: 17.2,
      baselineFatMass: 16.8,
      baselineLeanMass: 80.8,
      baselineMuscleMass: 76.8,
    };
    const current = {
      recordedAt: '2026-07-04T07:00:00',
      weight: 95,
      bodyFatPercent: 16,
      fatMass: 15.2,
      leanMass: 79.8,
      muscleMass: 76.3,
    };
    const summary = decorateGoalWithProgress(goal, current, [
      { date: '2026-06-20', weight: 97.6 },
      { date: '2026-06-27', weight: 96.2 },
      { date: '2026-07-04', weight: 95 },
    ]);

    expect(summary.progress.remainingWeightToGoal).toBeCloseTo(4.3, 1);
    expect(summary.progress.leanMassChangeSinceStart).toBeCloseTo(-1, 1);
    expect(summary.status.overall).toBe('yellow');
    expect(summary.estimatedCompletionDate).toBeTruthy();
  });

  it('validates cut goals require a target and target date', () => {
    expect(validateBodyCompositionGoalPayload({ phaseType: 'cut' })).toBe('Add at least a goal weight or body fat target.');
    expect(validateBodyCompositionGoalPayload({ phaseType: 'cut', goalWeight: 90.7 })).toBe('Target date is required.');
    expect(validateBodyCompositionGoalPayload({ phaseType: 'cut', goalWeight: 90.7, targetDate: '2026-12-31' })).toBeNull();
  });

  it('builds baseline snapshots only when usable data exists', () => {
    expect(buildGoalBaseline(null)).toBeNull();
    expect(buildGoalBaseline({
      recordedAt: '2026-06-20T07:00:00',
      weight: 97.6,
      bodyFatPercent: 17.2,
      fatMass: 16.8,
      leanMass: 80.8,
      muscleMass: 76.8,
    })).toMatchObject({
      baselineRecordedAt: '2026-06-20T07:00:00',
      baselineLeanMass: 80.8,
    });
  });
});
