import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({ getCurrentUserId: vi.fn() }));
vi.mock('@/lib/activeProfile', () => ({ getActiveProfileId: vi.fn() }));
vi.mock('@/lib/models/user', () => ({ findById: vi.fn(), update: vi.fn() }));
vi.mock('@/lib/models/weight', () => ({
  upsert: vi.fn(),
  findByProfile: vi.fn(),
  findByProfileAndDateRange: vi.fn(),
}));
vi.mock('@/lib/models/beverageEntry', () => ({
  findByIdForProfile: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));
vi.mock('@/lib/beverages', () => ({ normalizeBeverageEntryInput: (x) => x }));

import { getCurrentUserId } from '@/lib/auth';
import { getActiveProfileId } from '@/lib/activeProfile';
import * as User from '@/lib/models/user';
import * as Weight from '@/lib/models/weight';
import * as BeverageEntry from '@/lib/models/beverageEntry';

const USER_ID = 1;
const PROFILE_ID = 7;

function req({ body, localDate } = {}) {
  return {
    url: 'http://t/api/x',
    headers: { get: (k) => (k === 'x-local-date' ? localDate ?? null : null) },
    json: async () => body,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUserId.mockResolvedValue(USER_ID);
  getActiveProfileId.mockResolvedValue(PROFILE_ID);
});

describe('POST /api/weight', () => {
  it('upserts weight scoped to user_id + active profile_id', async () => {
    User.findById.mockResolvedValue({ id: USER_ID, weight: 70 });
    Weight.upsert.mockResolvedValue({ id: 1 });
    const { POST } = await import('@/app/api/weight/route.js');

    const res = await POST(req({ body: { date: '2030-01-02', weight: 81 } }));

    expect(res.status).toBe(201);
    expect(Weight.upsert).toHaveBeenCalledWith(expect.objectContaining({ userId: USER_ID, profileId: PROFILE_ID, weight: 81 }));
  });
});

describe('PUT /api/beverages/:id', () => {
  it('404s when the entry is not owned by the active profile', async () => {
    BeverageEntry.findByIdForProfile.mockResolvedValue(null);
    const { PUT } = await import('@/app/api/beverages/[id]/route.js');

    const res = await PUT(req({ body: {} }), { params: Promise.resolve({ id: '5' }) });

    expect(res.status).toBe(404);
    expect(BeverageEntry.findByIdForProfile).toHaveBeenCalledWith('5', PROFILE_ID);
    expect(BeverageEntry.update).not.toHaveBeenCalled();
  });

  it('updates scoped to the active profile', async () => {
    BeverageEntry.findByIdForProfile.mockResolvedValue({ id: 5, amount: 16, unit: 'fl_oz' });
    BeverageEntry.update.mockResolvedValue({ id: 5 });
    const { PUT } = await import('@/app/api/beverages/[id]/route.js');

    await PUT(req({ body: { amount: 20 } }), { params: Promise.resolve({ id: '5' }) });

    expect(BeverageEntry.update).toHaveBeenCalledWith('5', PROFILE_ID, expect.any(Object));
  });
});

describe('DELETE /api/beverages/:id', () => {
  it('deletes scoped to the active profile, 404 when nothing removed', async () => {
    BeverageEntry.remove.mockResolvedValueOnce(true);
    const { DELETE } = await import('@/app/api/beverages/[id]/route.js');
    expect((await DELETE(req(), { params: Promise.resolve({ id: '5' }) })).status).toBe(200);
    expect(BeverageEntry.remove).toHaveBeenCalledWith('5', PROFILE_ID);

    BeverageEntry.remove.mockResolvedValueOnce(false);
    expect((await DELETE(req(), { params: Promise.resolve({ id: '9' }) })).status).toBe(404);
  });
});
