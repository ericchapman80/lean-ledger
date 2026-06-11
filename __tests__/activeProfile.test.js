import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({ getCurrentUserId: vi.fn() }));
vi.mock('@/lib/models/profile', () => ({ findPrimaryByUserId: vi.fn(), isAccessibleToUser: vi.fn() }));
vi.mock('@/lib/models/user', () => ({ findById: vi.fn() }));
vi.mock('@/lib/models/profileHousehold', () => ({ ensurePrimaryProfileForUser: vi.fn() }));

import { getActiveProfileId } from '@/lib/activeProfile.js';
import { getCurrentUserId } from '@/lib/auth';
import { findPrimaryByUserId, isAccessibleToUser } from '@/lib/models/profile';
import { findById as findUserById } from '@/lib/models/user';
import { ensurePrimaryProfileForUser } from '@/lib/models/profileHousehold';

function withCookie(value) {
  return { cookies: { get: (name) => (name === 'll_active_profile' && value != null ? { value: String(value) } : undefined) } };
}

beforeEach(() => {
  vi.clearAllMocks();
  isAccessibleToUser.mockResolvedValue(false);
});

describe('getActiveProfileId', () => {
  it('returns the current user\'s primary profile id without creating anything', async () => {
    getCurrentUserId.mockResolvedValue(1);
    findPrimaryByUserId.mockResolvedValue({ id: 31, source_user_id: 1 });

    expect(await getActiveProfileId({})).toBe(31);
    expect(findPrimaryByUserId).toHaveBeenCalledWith(1);
    expect(ensurePrimaryProfileForUser).not.toHaveBeenCalled();
  });

  it('self-heals by creating the primary profile from the user row when missing', async () => {
    getCurrentUserId.mockResolvedValue(2);
    findPrimaryByUserId.mockResolvedValue(null);
    findUserById.mockResolvedValue({ id: 2, name: 'Konnor' });
    ensurePrimaryProfileForUser.mockResolvedValue({ id: 42 });

    expect(await getActiveProfileId({})).toBe(42);
    expect(findUserById).toHaveBeenCalledWith(2);
    expect(ensurePrimaryProfileForUser).toHaveBeenCalledWith({ id: 2, name: 'Konnor' });
  });

  it('returns null without self-healing when the user row does not exist (no FK violation)', async () => {
    getCurrentUserId.mockResolvedValue(3);
    findPrimaryByUserId.mockResolvedValue(null);
    findUserById.mockResolvedValue(null);

    expect(await getActiveProfileId({})).toBeNull();
    expect(ensurePrimaryProfileForUser).not.toHaveBeenCalled();
  });

  it('returns null if a profile still cannot be resolved', async () => {
    getCurrentUserId.mockResolvedValue(4);
    findPrimaryByUserId.mockResolvedValue(null);
    findUserById.mockResolvedValue({ id: 4 });
    ensurePrimaryProfileForUser.mockResolvedValue(null);

    expect(await getActiveProfileId({})).toBeNull();
  });

  it('honors a valid active-profile cookie pointing at an accessible profile', async () => {
    getCurrentUserId.mockResolvedValue(1);
    isAccessibleToUser.mockResolvedValue(true);

    expect(await getActiveProfileId(withCookie(99))).toBe(99);
    expect(isAccessibleToUser).toHaveBeenCalledWith(99, 1);
    expect(findPrimaryByUserId).not.toHaveBeenCalled();
  });

  it('ignores a cookie pointing at a profile outside the user\'s households', async () => {
    getCurrentUserId.mockResolvedValue(1);
    isAccessibleToUser.mockResolvedValue(false);
    findPrimaryByUserId.mockResolvedValue({ id: 31, source_user_id: 1 });

    expect(await getActiveProfileId(withCookie(99))).toBe(31);
    expect(isAccessibleToUser).toHaveBeenCalledWith(99, 1);
  });

  it('ignores a malformed cookie value', async () => {
    getCurrentUserId.mockResolvedValue(1);
    findPrimaryByUserId.mockResolvedValue({ id: 31, source_user_id: 1 });

    expect(await getActiveProfileId(withCookie('not-a-number'))).toBe(31);
    expect(isAccessibleToUser).not.toHaveBeenCalled();
  });
});
