import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({ getCurrentUserId: vi.fn() }));
vi.mock('@/lib/models/profile', () => ({ findPrimaryByUserId: vi.fn() }));
vi.mock('@/lib/models/user', () => ({ findById: vi.fn() }));
vi.mock('@/lib/models/profileHousehold', () => ({ ensurePrimaryProfileForUser: vi.fn() }));

import { getActiveProfileId } from '@/lib/activeProfile.js';
import { getCurrentUserId } from '@/lib/auth';
import { findPrimaryByUserId } from '@/lib/models/profile';
import { findById as findUserById } from '@/lib/models/user';
import { ensurePrimaryProfileForUser } from '@/lib/models/profileHousehold';

beforeEach(() => {
  vi.clearAllMocks();
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

  it('falls back to a minimal user object when the user row cannot be loaded', async () => {
    getCurrentUserId.mockResolvedValue(3);
    findPrimaryByUserId.mockResolvedValue(null);
    findUserById.mockResolvedValue(null);
    ensurePrimaryProfileForUser.mockResolvedValue({ id: 50 });

    expect(await getActiveProfileId({})).toBe(50);
    expect(ensurePrimaryProfileForUser).toHaveBeenCalledWith({ id: 3 });
  });

  it('returns null if a profile still cannot be resolved', async () => {
    getCurrentUserId.mockResolvedValue(4);
    findPrimaryByUserId.mockResolvedValue(null);
    findUserById.mockResolvedValue({ id: 4 });
    ensurePrimaryProfileForUser.mockResolvedValue(null);

    expect(await getActiveProfileId({})).toBeNull();
  });
});
