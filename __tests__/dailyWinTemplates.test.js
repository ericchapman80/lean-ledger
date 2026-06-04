import { describe, expect, it } from 'vitest';
import { applyDailyWinTemplate, buildDailyWinChallengeSummary, findDailyWinTemplate } from '@/lib/dailyWinTemplates.js';

describe('daily win templates', () => {
  it('finds known templates', () => {
    expect(findDailyWinTemplate('faith_and_fitness')?.name).toBe('Faith + Fitness');
  });

  it('applies a template with suggested keys and seeded custom habits', () => {
    const result = applyDailyWinTemplate({
      templateKey: 'hard_75_inspired',
      customHabits: [],
    });

    expect(result.suggestedKeys).toEqual([
      'workoutCompleted',
      'readingCompleted',
      'sleepHours',
      'energyLevel',
      'sorenessLevel',
    ]);
    expect(result.customHabits.map((habit) => habit.name)).toEqual([
      'Progress Photo',
      'No Alcohol',
      'Outdoor Walk',
    ]);
  });

  it('reuses existing custom habits by name when applying a template', () => {
    const result = applyDailyWinTemplate({
      templateKey: 'lean_recomp_foundations',
      customHabits: [
        { id: 42, name: 'Protein Goal Hit', isActive: false, sortOrder: 3 },
      ],
    });

    expect(result.customHabits[0].id).toBe(42);
    expect(result.customHabits[0].name).toBe('Protein Goal Hit');
    expect(result.customHabits[1].name).toBe('Water Goal Hit');
  });

  it('builds challenge progress from the template duration and start date', () => {
    const result = buildDailyWinChallengeSummary({
      templateKey: 'hard_75_inspired',
      challengeStartDate: '2026-06-01',
      referenceDate: '2026-06-10',
      dailyWinsSummary: { completed: 4, total: 5 },
    });

    expect(result.templateName).toBe('75 Hard Inspired');
    expect(result.dayNumber).toBe(10);
    expect(result.durationDays).toBe(75);
    expect(result.daysRemaining).toBe(65);
    expect(result.percentComplete).toBe(13);
    expect(result.todayCompletedWins).toBe(4);
    expect(result.todayPerfect).toBe(false);
  });
});
