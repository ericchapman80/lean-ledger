import { describe, expect, it } from 'vitest';
import {
  getUserOwnedTables,
  normalizeOwnerClaimInput,
  summarizeOwnerClaimState,
} from '@/lib/authOwner.js';

describe('normalizeOwnerClaimInput', () => {
  it('normalizes and validates claim input', () => {
    expect(normalizeOwnerClaimInput({
      email: ' Owner@Example.com ',
      name: ' Owner Name ',
    })).toEqual({
      userId: 1,
      email: 'owner@example.com',
      name: 'Owner Name',
      verifyEmail: true,
    });
  });

  it('rejects missing email and invalid user ids', () => {
    expect(() => normalizeOwnerClaimInput({})).toThrow('AUTH_OWNER_EMAIL is required.');
    expect(() => normalizeOwnerClaimInput({ email: 'owner@example.com', userId: '0' }))
      .toThrow('AUTH_OWNER_USER_ID must be a positive integer.');
  });
});

describe('getUserOwnedTables', () => {
  it('returns the expected user-owned tables for verification', () => {
    expect(getUserOwnedTables()).toContain('meals');
    expect(getUserOwnedTables()).toContain('water_entries');
    expect(getUserOwnedTables()).toContain('daily_habit_logs');
  });
});

describe('summarizeOwnerClaimState', () => {
  it('returns a compact owner-claim verification summary', () => {
    expect(summarizeOwnerClaimState({
      ownerUser: { id: 1, email: 'owner@example.com', name: 'Owner', emailVerified: '2026-06-04T00:00:00Z' },
      conflictingUser: null,
      accounts: [{ userId: 1 }, { userId: 1 }],
      counts: { meals: 130 },
    })).toEqual({
      ownerUserId: 1,
      ownerEmail: 'owner@example.com',
      ownerName: 'Owner',
      ownerEmailVerified: '2026-06-04T00:00:00Z',
      conflictingUserId: null,
      linkedAccountUserIds: [1, 1],
      tableCounts: { meals: 130 },
    });
  });
});
