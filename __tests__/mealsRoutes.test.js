import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({ getCurrentUserId: vi.fn() }));
vi.mock('@/lib/activeProfile', () => ({ getActiveProfileId: vi.fn() }));
vi.mock('@/lib/models/meal', () => ({
  create: vi.fn(),
  findByProfileAndDate: vi.fn(),
  findByProfileAndDateRange: vi.fn(),
  findByIdForProfile: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

import { getCurrentUserId } from '@/lib/auth';
import { getActiveProfileId } from '@/lib/activeProfile';
import * as Meal from '@/lib/models/meal';

const USER_ID = 1;
const PROFILE_ID = 7;

function req({ url = 'http://t/api/meals', body, localDate } = {}) {
  return {
    url,
    headers: { get: (k) => (k === 'x-local-date' ? localDate ?? null : null) },
    json: async () => body,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUserId.mockResolvedValue(USER_ID);
  getActiveProfileId.mockResolvedValue(PROFILE_ID);
});

describe('GET /api/meals', () => {
  it('reads a single date scoped to the active profile', async () => {
    Meal.findByProfileAndDate.mockResolvedValue([{ id: 1, mealName: 'eggs' }]);
    const { GET } = await import('@/app/api/meals/route.js');

    const res = await GET(req({ url: 'http://t/api/meals?date=2030-01-02' }));

    expect(res.status).toBe(200);
    expect(Meal.findByProfileAndDate).toHaveBeenCalledWith(PROFILE_ID, '2030-01-02');
  });

  it('reads a date range scoped to the active profile', async () => {
    Meal.findByProfileAndDateRange.mockResolvedValue([]);
    const { GET } = await import('@/app/api/meals/route.js');

    await GET(req({ url: 'http://t/api/meals?startDate=2030-01-01&endDate=2030-01-31' }));

    expect(Meal.findByProfileAndDateRange).toHaveBeenCalledWith(PROFILE_ID, '2030-01-01', '2030-01-31');
  });
});

describe('POST /api/meals', () => {
  it('creates a meal carrying both user_id and the active profile_id', async () => {
    Meal.create.mockResolvedValue({ id: 9 });
    const { POST } = await import('@/app/api/meals/route.js');

    const res = await POST(req({
      body: { date: '2030-01-02', mealName: 'eggs', protein: 20, fat: 10, carbs: 30, calories: 290 },
    }));

    expect(res.status).toBe(201);
    expect(Meal.create).toHaveBeenCalledTimes(1);
    const arg = Meal.create.mock.calls[0][0];
    expect(arg.profileId).toBe(PROFILE_ID);
    expect(arg.userId).toBe(USER_ID);
  });
});

describe('PUT /api/meals/:id', () => {
  it('404s when the id is not owned by the active profile', async () => {
    Meal.findByIdForProfile.mockResolvedValue(null);
    const { PUT } = await import('@/app/api/meals/[id]/route.js');

    const res = await PUT(req({ body: { mealName: 'x', protein: 1, fat: 1, carbs: 1, calories: 1 } }), { params: Promise.resolve({ id: '55' }) });

    expect(res.status).toBe(404);
    expect(Meal.findByIdForProfile).toHaveBeenCalledWith('55', PROFILE_ID);
    expect(Meal.update).not.toHaveBeenCalled();
  });

  it('updates scoped to the active profile', async () => {
    Meal.findByIdForProfile.mockResolvedValue({ id: 55, mealType: 'breakfast' });
    Meal.update.mockResolvedValue({ id: 55, mealName: 'updated' });
    const { PUT } = await import('@/app/api/meals/[id]/route.js');

    const res = await PUT(req({ body: { mealName: 'updated', protein: 1, fat: 1, carbs: 1, calories: 1 } }), { params: Promise.resolve({ id: '55' }) });

    expect(res.status).toBe(200);
    expect(Meal.update).toHaveBeenCalledWith('55', PROFILE_ID, expect.objectContaining({ mealName: 'updated' }));
  });
});

describe('DELETE /api/meals/:id', () => {
  it('deletes scoped to the active profile', async () => {
    Meal.remove.mockResolvedValue(true);
    const { DELETE } = await import('@/app/api/meals/[id]/route.js');

    const res = await DELETE(req(), { params: Promise.resolve({ id: '55' }) });

    expect(res.status).toBe(200);
    expect(Meal.remove).toHaveBeenCalledWith('55', PROFILE_ID);
  });

  it('404s when nothing was deleted (wrong profile or missing)', async () => {
    Meal.remove.mockResolvedValue(false);
    const { DELETE } = await import('@/app/api/meals/[id]/route.js');

    const res = await DELETE(req(), { params: Promise.resolve({ id: '55' }) });

    expect(res.status).toBe(404);
  });
});
