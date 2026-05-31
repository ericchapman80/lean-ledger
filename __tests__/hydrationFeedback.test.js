import { describe, expect, it } from 'vitest';
import { summarizeBeverageEntries } from '@/lib/beverages.js';
import { getHydrationFeedback } from '@/lib/hydrationFeedback.js';

function buildFeedback(entries, options = {}) {
  const summary = summarizeBeverageEntries(entries, {
    preferredUnit: 'fl_oz',
    weightKg: options.weightKg ?? 80,
    workoutCompleted: options.workoutCompleted ?? false,
  });

  return getHydrationFeedback({
    entries,
    summary,
    dietStyle: options.dietStyle ?? 'balanced',
    workoutCompleted: options.workoutCompleted ?? false,
    isCurrentDay: options.isCurrentDay ?? false,
    currentHour: options.currentHour ?? 12,
  });
}

describe('getHydrationFeedback', () => {
  it('flags when hydration is behind late in the current day', () => {
    const feedback = buildFeedback([
      { beverageType: 'water', countsTowardHydration: true, amountFlOz: 12, recordedAt: '2026-05-30T10:00', caffeineMg: 0 },
    ], {
      weightKg: 90,
      isCurrentDay: true,
      currentHour: 16,
    });

    expect(feedback).toMatchObject({
      shortLabel: 'Behind on hydration',
      tone: 'neutral',
    });
  });

  it('recognizes workout-adjusted hydration coverage', () => {
    const feedback = buildFeedback([
      { beverageType: 'water', countsTowardHydration: true, amountFlOz: 70, recordedAt: '2026-05-30T09:00', caffeineMg: 0 },
      { beverageType: 'electrolyte_drink', countsTowardHydration: true, amountFlOz: 40, recordedAt: '2026-05-30T13:00', caffeineMg: 0 },
    ], {
      weightKg: 80,
      workoutCompleted: true,
    });

    expect(feedback).toMatchObject({
      shortLabel: 'Workout hydration covered',
      tone: 'positive',
    });
  });

  it('calls out late-day hydration loading', () => {
    const feedback = buildFeedback([
      { beverageType: 'water', countsTowardHydration: true, amountFlOz: 12, recordedAt: '2026-05-30T11:00', caffeineMg: 0 },
      { beverageType: 'water', countsTowardHydration: true, amountFlOz: 28, recordedAt: '2026-05-30T18:30', caffeineMg: 0 },
      { beverageType: 'unsweet_tea', countsTowardHydration: true, amountFlOz: 20, recordedAt: '2026-05-30T20:00', caffeineMg: 20 },
    ], {
      weightKg: 80,
    });

    expect(feedback).toMatchObject({
      shortLabel: 'Late-day hydration load',
      tone: 'neutral',
    });
  });

  it('calls out a caffeine-heavy hydration mix', () => {
    const feedback = buildFeedback([
      { beverageType: 'black_coffee', countsTowardHydration: true, amountFlOz: 20, recordedAt: '2026-05-30T08:00', caffeineMg: 180 },
      { beverageType: 'diet_drink', countsTowardHydration: true, amountFlOz: 24, recordedAt: '2026-05-30T12:00', caffeineMg: 70 },
      { beverageType: 'water', countsTowardHydration: true, amountFlOz: 12, recordedAt: '2026-05-30T14:00', caffeineMg: 0 },
    ], {
      weightKg: 60,
    });

    expect(feedback).toMatchObject({
      shortLabel: 'Caffeine-heavy mix',
      tone: 'neutral',
    });
  });

  it('explains when fluids are not counting fully toward hydration', () => {
    const feedback = buildFeedback([
      { beverageType: 'protein_shake', countsTowardHydration: false, amountFlOz: 24, recordedAt: '2026-05-30T09:00', caffeineMg: 0 },
      { beverageType: 'milk', countsTowardHydration: false, amountFlOz: 20, recordedAt: '2026-05-30T12:00', caffeineMg: 0 },
      { beverageType: 'water', countsTowardHydration: true, amountFlOz: 12, recordedAt: '2026-05-30T15:00', caffeineMg: 0 },
    ], {
      weightKg: 70,
    });

    expect(feedback).toMatchObject({
      shortLabel: 'Fluids not counting fully',
      tone: 'neutral',
    });
  });
});
