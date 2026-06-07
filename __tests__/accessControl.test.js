import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({
  getCurrentUserId: vi.fn(),
}));

vi.mock('@/lib/models/user', () => ({
  findById: vi.fn(),
}));

import {
  canAccessByInvite,
  getAccessDeniedRedirect,
  normalizeMemberPayload,
} from '@/lib/accessControl.js';

describe('normalizeMemberPayload', () => {
  it('normalizes email, role, and note for new member invites', () => {
    expect(normalizeMemberPayload({
      email: '  Kid@Example.com ',
      role: 'admin',
      note: '  Family member  ',
    })).toEqual({
      email: 'kid@example.com',
      role: 'admin',
      note: 'Family member',
    });
  });

  it('defaults invalid roles to member', () => {
    expect(normalizeMemberPayload({
      email: 'kid@example.com',
      role: 'super-admin',
    })).toEqual({
      email: 'kid@example.com',
      role: 'member',
      note: null,
    });
  });
});

describe('canAccessByInvite', () => {
  it('allows active and accepted invites but blocks revoked or missing ones', () => {
    expect(canAccessByInvite({ revokedAt: null, acceptedAt: null })).toBe(true);
    expect(canAccessByInvite({ revokedAt: null, acceptedAt: '2026-06-07T00:00:00Z' })).toBe(true);
    expect(canAccessByInvite({ revokedAt: '2026-06-07T00:00:00Z' })).toBe(false);
    expect(canAccessByInvite(null)).toBe(false);
  });
});

describe('getAccessDeniedRedirect', () => {
  it('uses the friendly login denial target', () => {
    expect(getAccessDeniedRedirect()).toBe('/login?reason=access-denied');
  });
});
