import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sqlMock } = vi.hoisted(() => ({
  sqlMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  sql: sqlMock,
}));

import {
  deriveDefaultHouseholdName,
  deriveDefaultProfileName,
  ensureDefaultHouseholdForUser,
  ensurePrimaryProfileForUser,
} from '@/lib/models/profileHousehold.js';

describe('deriveDefaultHouseholdName', () => {
  it('prefers the user name when available', () => {
    expect(deriveDefaultHouseholdName({ id: 1, name: 'Eric Chapman', email: 'eric@example.com' }))
      .toBe("Eric Chapman's Household");
  });

  it('falls back to the email local-part and then the user id', () => {
    expect(deriveDefaultHouseholdName({ id: 2, name: '', email: 'konnor@example.com' }))
      .toBe("konnor's Household");
    expect(deriveDefaultHouseholdName({ id: 3, name: '', email: null }))
      .toBe('Household 3');
  });
});

describe('deriveDefaultProfileName', () => {
  it('prefers the user name and falls back cleanly', () => {
    expect(deriveDefaultProfileName({ id: 1, name: 'Eric Chapman', email: 'eric@example.com' }))
      .toBe('Eric Chapman');
    expect(deriveDefaultProfileName({ id: 2, name: '', email: 'konnor@example.com' }))
      .toBe('konnor');
    expect(deriveDefaultProfileName({ id: 3, name: '', email: null }))
      .toBe('Profile 3');
  });
});

describe('ensureDefaultHouseholdForUser', () => {
  beforeEach(() => {
    sqlMock.mockReset();
  });

  it('creates a default household and owner membership when missing', async () => {
    sqlMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 11, created_by_user_id: 1, name: "Eric Chapman's Household" }])
      .mockResolvedValueOnce([]);

    const household = await ensureDefaultHouseholdForUser({ id: 1, name: 'Eric Chapman', email: 'eric@example.com' });

    expect(household.id).toBe(11);
    expect(sqlMock).toHaveBeenCalledTimes(3);
    expect(sqlMock.mock.calls[1][0].join(' ')).toContain('INSERT INTO households');
    expect(sqlMock.mock.calls[2][0].join(' ')).toContain('INSERT INTO household_members');
  });

  it('reuses an existing household and still enforces owner membership', async () => {
    sqlMock
      .mockResolvedValueOnce([{ id: 15, created_by_user_id: 1, name: "Eric Chapman's Household" }])
      .mockResolvedValueOnce([]);

    const household = await ensureDefaultHouseholdForUser({ id: 1, name: 'Eric Chapman', email: 'eric@example.com' });

    expect(household.id).toBe(15);
    expect(sqlMock).toHaveBeenCalledTimes(2);
    expect(sqlMock.mock.calls[1][0].join(' ')).toContain('INSERT INTO household_members');
  });
});

describe('ensurePrimaryProfileForUser', () => {
  beforeEach(() => {
    sqlMock.mockReset();
  });

  it('upserts a primary profile for the user after ensuring the household exists', async () => {
    sqlMock
      .mockResolvedValueOnce([{ id: 21, created_by_user_id: 1, name: "Eric Chapman's Household" }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 31, source_user_id: 1, household_id: 21, name: 'Eric Chapman' }]);

    const profile = await ensurePrimaryProfileForUser({
      id: 1,
      name: 'Eric Chapman',
      email: 'eric@example.com',
      dateOfBirth: '1992-06-07',
      age: 34,
      height: 180,
      weight: 90,
      gender: 'male',
      activityLevel: 'moderate',
      goal: 'recomp',
      goalStrategy: 'lean_recomp',
      activityFocus: ['general_fitness'],
      dietStyle: 'balanced',
      units: 'imperial',
      dailyWinsActiveKeys: ['workoutCompleted'],
      dailyWinsTemplateKey: 'faith_and_fitness',
      dailyWinsChallengeStartDate: '2026-06-08',
      customMacros: { protein: 200, fat: 80, carbs: 150, calories: 2200 },
    });

    expect(profile.id).toBe(31);
    expect(sqlMock).toHaveBeenCalledTimes(3);
    expect(sqlMock.mock.calls[2][0].join(' ')).toContain('INSERT INTO profiles');
    expect(sqlMock.mock.calls[2][0].join(' ')).toContain('ON CONFLICT (source_user_id) DO UPDATE');
  });
});
