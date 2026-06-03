import { describe, expect, it } from 'vitest';
import { applyDailyWinTemplate, findDailyWinTemplate } from '@/lib/dailyWinTemplates.js';

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
});
