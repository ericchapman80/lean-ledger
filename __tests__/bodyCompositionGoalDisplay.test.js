import { describe, expect, it } from 'vitest';
import {
  buildBodyCompositionGoalPayload,
  formatBodyFatTarget,
  formatGoalMass,
  formatGoalPercent,
  getBodyCompositionGoalForm,
  getGoalOutcomeLabel,
  getBodyCompositionStatusMeta,
} from '@/lib/bodyCompositionGoalDisplay.js';

describe('bodyCompositionGoalDisplay', () => {
  it('formats mass values in profile units', () => {
    expect(formatGoalMass(90.7, 'imperial')).toBe('200 lb');
    expect(formatGoalMass(90.7, 'metric')).toBe('90.7 kg');
  });

  it('formats body fat targets as exact values or ranges', () => {
    expect(formatGoalPercent(12)).toBe('12%');
    expect(formatBodyFatTarget({ goalBodyFatPercent: 12 })).toBe('12%');
    expect(formatBodyFatTarget({ targetBodyFatMin: 10, targetBodyFatMax: 12 })).toBe('10%–12%');
  });

  it('converts form state into canonical payload values', () => {
    expect(buildBodyCompositionGoalPayload({
      name: 'Project 200',
      goalWeight: '200',
      goalBodyFatPercent: '12',
      minimumLeanMass: '176',
      minimumMuscleMass: '168',
      targetDate: '2026-12-31',
    }, 'imperial')).toMatchObject({
      name: 'Project 200',
      phaseType: 'cut',
      goalWeight: 90.7,
      goalBodyFatPercent: 12,
      minimumLeanMass: 79.8,
      minimumMuscleMass: 76.2,
      targetDate: '2026-12-31',
    });
  });

  it('prefers body fat ranges over exact targets when both are present', () => {
    expect(buildBodyCompositionGoalPayload({
      name: 'Project Titan',
      goalBodyFatPercent: '11',
      targetBodyFatMin: '10',
      targetBodyFatMax: '12',
    }, 'imperial')).toMatchObject({
      goalBodyFatPercent: null,
      targetBodyFatMin: 10,
      targetBodyFatMax: 12,
    });
  });

  it('builds editable form state from a goal object', () => {
    expect(getBodyCompositionGoalForm({
      name: 'Project 200',
      goalWeight: 90.7,
      goalBodyFatPercent: 12,
      minimumLeanMass: 79.8,
      minimumMuscleMass: 76.2,
      targetDate: '2026-12-31',
    }, 'imperial')).toMatchObject({
      name: 'Project 200',
      goalWeight: '200',
      goalBodyFatPercent: '12',
      minimumLeanMass: '175.9',
      minimumMuscleMass: '168',
    });
  });

  it('returns status metadata for UI pills', () => {
    expect(getBodyCompositionStatusMeta('green').label).toBe('On track');
    expect(getBodyCompositionStatusMeta('yellow').label).toBe('Watch');
    expect(getBodyCompositionStatusMeta('red').label).toBe('Needs attention');
  });

  it('returns clear outcome labels for completed or archived phases', () => {
    expect(getGoalOutcomeLabel({ completedAt: '2026-08-01', isIdealSuccess: true })).toBe('Ideal Outcome');
    expect(getGoalOutcomeLabel({ completedAt: '2026-08-01', isIdealSuccess: false })).toBe('Completed');
    expect(getGoalOutcomeLabel({ archivedAt: '2026-08-01' })).toBe('Archived');
  });
});
