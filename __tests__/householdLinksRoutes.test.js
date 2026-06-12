import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({ getCurrentUserId: vi.fn() }));
vi.mock('@/lib/models/user', () => ({
  findById: vi.fn(),
  findByEmail: vi.fn(),
}));
vi.mock('@/lib/models/profile', () => ({
  findPrimaryByUserId: vi.fn(),
}));
vi.mock('@/lib/models/profileHousehold', () => ({
  findMembershipForUser: vi.fn(),
  isHouseholdManager: (role) => role === 'owner' || role === 'admin',
  linkExistingAccountToHousehold: vi.fn(),
  unlinkExistingAccountFromHousehold: vi.fn(),
}));
vi.mock('@/lib/models/householdLinkInvitation', () => ({
  findActiveByHouseholdAndEmail: vi.fn(),
  createInvitation: vi.fn(),
  listReceivedForUser: vi.fn(),
  listSentForHousehold: vi.fn(),
  findById: vi.fn(),
  markAccepted: vi.fn(),
  markDeclined: vi.fn(),
  revoke: vi.fn(),
}));

import { getCurrentUserId } from '@/lib/auth';
import * as User from '@/lib/models/user';
import * as Profile from '@/lib/models/profile';
import * as ProfileHousehold from '@/lib/models/profileHousehold';
import * as HouseholdInvitations from '@/lib/models/householdLinkInvitation';

const USER_ID = 10;
const HOUSEHOLD_ID = 20;

function req(body = null, url = 'http://localhost/api/household-links') {
  return {
    url,
    json: async () => body,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUserId.mockResolvedValue(USER_ID);
  User.findById.mockResolvedValue({ id: USER_ID, email: 'me@example.com', name: 'Me' });
  ProfileHousehold.findMembershipForUser.mockResolvedValue({ householdId: HOUSEHOLD_ID, role: 'owner' });
  HouseholdInvitations.listReceivedForUser.mockResolvedValue([]);
  HouseholdInvitations.listSentForHousehold.mockResolvedValue([]);
});

describe('GET /api/household-links/lookup', () => {
  it('403s for non-managers', async () => {
    ProfileHousehold.findMembershipForUser.mockResolvedValue({ householdId: HOUSEHOLD_ID, role: 'member' });
    const { GET } = await import('@/app/api/household-links/lookup/route.js');
    const res = await GET(req(null, 'http://localhost/api/household-links/lookup?email=konnor@example.com'));
    expect(res.status).toBe(403);
  });

  it('returns existing-user lookup metadata', async () => {
    User.findByEmail.mockResolvedValue({ id: 22, name: 'Konnor', email: 'konnor@example.com' });
    Profile.findPrimaryByUserId.mockResolvedValue({ household_id: 999 });
    HouseholdInvitations.findActiveByHouseholdAndEmail.mockResolvedValue(null);

    const { GET } = await import('@/app/api/household-links/lookup/route.js');
    const res = await GET(req(null, 'http://localhost/api/household-links/lookup?email=konnor@example.com'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.exists).toBe(true);
    expect(body.user.email).toBe('konnor@example.com');
    expect(body.alreadyInHousehold).toBe(false);
    expect(body.canInvite).toBe(true);
  });
});

describe('POST /api/household-links', () => {
  it('creates an invitation for an existing account', async () => {
    User.findByEmail.mockResolvedValue({ id: 22, name: 'Konnor', email: 'konnor@example.com' });
    Profile.findPrimaryByUserId.mockResolvedValue({ household_id: 999 });
    HouseholdInvitations.findActiveByHouseholdAndEmail.mockResolvedValue(null);
    HouseholdInvitations.createInvitation.mockResolvedValue({ id: 5, invitedEmail: 'konnor@example.com', status: 'pending' });

    const { POST } = await import('@/app/api/household-links/route.js');
    const res = await POST(req({ email: 'konnor@example.com', role: 'member' }));

    expect(res.status).toBe(201);
    expect(HouseholdInvitations.createInvitation).toHaveBeenCalledWith({
      householdId: HOUSEHOLD_ID,
      invitedEmail: 'konnor@example.com',
      invitedUserId: 22,
      invitedByUserId: USER_ID,
      role: 'member',
      note: null,
    });
  });
});

describe('POST /api/household-links/:id/accept', () => {
  it('links the existing account and marks the invite accepted', async () => {
    HouseholdInvitations.findById.mockResolvedValue({
      id: 8,
      householdId: HOUSEHOLD_ID,
      invitedEmail: 'me@example.com',
      role: 'member',
      status: 'pending',
    });
    HouseholdInvitations.markAccepted.mockResolvedValue({ id: 8, status: 'accepted' });

    const { POST } = await import('@/app/api/household-links/[id]/accept/route.js');
    const res = await POST({}, { params: Promise.resolve({ id: '8' }) });

    expect(res.status).toBe(200);
    expect(ProfileHousehold.linkExistingAccountToHousehold).toHaveBeenCalledWith({
      householdId: HOUSEHOLD_ID,
      targetUser: { id: USER_ID, email: 'me@example.com', name: 'Me' },
      role: 'member',
    });
    expect(HouseholdInvitations.markAccepted).toHaveBeenCalledWith(8);
  });
});

describe('POST /api/profiles/:id/unlink', () => {
  it('unlinks a linked existing account profile for a manager', async () => {
    ProfileHousehold.unlinkExistingAccountFromHousehold.mockResolvedValue({ profileId: 31, status: 'unlinked' });
    const { POST } = await import('@/app/api/profiles/[id]/unlink/route.js');
    const res = await POST({}, { params: Promise.resolve({ id: '31' }) });

    expect(res.status).toBe(200);
    expect(ProfileHousehold.unlinkExistingAccountFromHousehold).toHaveBeenCalledWith({
      householdId: HOUSEHOLD_ID,
      profileId: 31,
      actingUserId: USER_ID,
    });
  });
});
