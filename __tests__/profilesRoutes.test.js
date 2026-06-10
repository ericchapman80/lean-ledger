import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({ getCurrentUserId: vi.fn() }));
vi.mock('@/lib/models/profile', () => ({
  listByHousehold: vi.fn(),
  createDependent: vi.fn(),
  findByIdInHousehold: vi.fn(),
  update: vi.fn(),
  removeDependent: vi.fn(),
  isAccessibleToUser: vi.fn(),
}));
vi.mock('@/lib/models/profileHousehold', () => ({
  findMembershipForUser: vi.fn(),
  isHouseholdManager: (role) => role === 'owner' || role === 'admin',
}));
vi.mock('@/lib/profile', () => ({ validateProfilePayload: vi.fn(() => null) }));

import { getCurrentUserId } from '@/lib/auth';
import * as Profile from '@/lib/models/profile';
import { findMembershipForUser } from '@/lib/models/profileHousehold';

const USER_ID = 1;
const HOUSEHOLD_ID = 10;

function req(body) {
  return { json: async () => body };
}

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUserId.mockResolvedValue(USER_ID);
  findMembershipForUser.mockResolvedValue({ householdId: HOUSEHOLD_ID, role: 'owner' });
});

describe('GET /api/profiles', () => {
  it('lists profiles for the caller\'s household', async () => {
    Profile.listByHousehold.mockResolvedValue([{ id: 1, isPrimary: true }]);
    const { GET } = await import('@/app/api/profiles/route.js');
    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(Profile.listByHousehold).toHaveBeenCalledWith(HOUSEHOLD_ID);
  });

  it('returns [] when the user has no household', async () => {
    findMembershipForUser.mockResolvedValue(null);
    const { GET } = await import('@/app/api/profiles/route.js');
    expect(await (await GET(req())).json()).toEqual([]);
  });
});

describe('POST /api/profiles', () => {
  it('403s for non-managers', async () => {
    findMembershipForUser.mockResolvedValue({ householdId: HOUSEHOLD_ID, role: 'member' });
    const { POST } = await import('@/app/api/profiles/route.js');
    const res = await POST(req({ name: 'Kid', dateOfBirth: '2012-01-01' }));
    expect(res.status).toBe(403);
    expect(Profile.createDependent).not.toHaveBeenCalled();
  });

  it('creates a dependent in the caller\'s household for owners', async () => {
    Profile.createDependent.mockResolvedValue({ id: 50, isDependent: true });
    const { POST } = await import('@/app/api/profiles/route.js');
    const res = await POST(req({ name: 'Kid', dateOfBirth: '2012-01-01', height: 150, weight: 45, gender: 'male', activityLevel: 'active', goal: 'maintain' }));
    expect(res.status).toBe(201);
    const arg = Profile.createDependent.mock.calls[0][0];
    expect(arg.householdId).toBe(HOUSEHOLD_ID);
    expect(arg.managedByUserId).toBe(USER_ID);
  });

  it('400s without a name', async () => {
    const { POST } = await import('@/app/api/profiles/route.js');
    expect((await POST(req({ dateOfBirth: '2012-01-01' }))).status).toBe(400);
  });
});

describe('POST /api/profiles/:id/activate', () => {
  it('sets the active-profile cookie for an accessible profile', async () => {
    Profile.isAccessibleToUser.mockResolvedValue(true);
    const { POST } = await import('@/app/api/profiles/[id]/activate/route.js');
    const res = await POST({}, { params: Promise.resolve({ id: '5' }) });
    expect(res.status).toBe(200);
    expect(Profile.isAccessibleToUser).toHaveBeenCalledWith(5, USER_ID);
    expect(res.cookies.get('ll_active_profile')?.value).toBe('5');
  });

  it('404s (no cookie) for a profile outside the caller\'s households', async () => {
    Profile.isAccessibleToUser.mockResolvedValue(false);
    const { POST } = await import('@/app/api/profiles/[id]/activate/route.js');
    const res = await POST({}, { params: Promise.resolve({ id: '5' }) });
    expect(res.status).toBe(404);
    expect(res.cookies.get('ll_active_profile')).toBeUndefined();
  });
});

describe('DELETE /api/profiles/:id', () => {
  it('403s for non-managers', async () => {
    findMembershipForUser.mockResolvedValue({ householdId: HOUSEHOLD_ID, role: 'member' });
    const { DELETE } = await import('@/app/api/profiles/[id]/route.js');
    const res = await DELETE({}, { params: Promise.resolve({ id: '5' }) });
    expect(res.status).toBe(403);
    expect(Profile.removeDependent).not.toHaveBeenCalled();
  });

  it('removes a dependent scoped to the household', async () => {
    Profile.removeDependent.mockResolvedValue(true);
    const { DELETE } = await import('@/app/api/profiles/[id]/route.js');
    const res = await DELETE({}, { params: Promise.resolve({ id: '5' }) });
    expect(res.status).toBe(200);
    expect(Profile.removeDependent).toHaveBeenCalledWith(5, HOUSEHOLD_ID);
  });
});
