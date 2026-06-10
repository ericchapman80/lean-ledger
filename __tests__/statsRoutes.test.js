import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/activeProfile', () => ({ getActiveProfileId: vi.fn() }));
vi.mock('@/lib/models/meal', () => ({ findByProfileAndDateRange: vi.fn() }));
vi.mock('@/lib/models/beverageEntry', () => ({ findByProfileAndDateRange: vi.fn() }));

import { getActiveProfileId } from '@/lib/activeProfile';
import * as Meal from '@/lib/models/meal';
import * as Beverage from '@/lib/models/beverageEntry';

const PROFILE_ID = 7;

function req(url) {
  return { url };
}

beforeEach(() => {
  vi.clearAllMocks();
  getActiveProfileId.mockResolvedValue(PROFILE_ID);
  Meal.findByProfileAndDateRange.mockResolvedValue([]);
  Beverage.findByProfileAndDateRange.mockResolvedValue([]);
});

describe('GET /api/stats/trends', () => {
  it('reads meals and beverages scoped to the active profile', async () => {
    const { GET } = await import('@/app/api/stats/trends/route.js');
    const res = await GET(req('http://t/api/stats/trends?startDate=2030-01-01&endDate=2030-01-07'));

    expect(res.status).toBe(200);
    expect(Meal.findByProfileAndDateRange).toHaveBeenCalledWith(PROFILE_ID, '2030-01-01', '2030-01-07');
    expect(Beverage.findByProfileAndDateRange).toHaveBeenCalledWith(PROFILE_ID, '2030-01-01', '2030-01-07');
  });

  it('400s without a date range (no data read)', async () => {
    const { GET } = await import('@/app/api/stats/trends/route.js');
    const res = await GET(req('http://t/api/stats/trends'));

    expect(res.status).toBe(400);
    expect(Meal.findByProfileAndDateRange).not.toHaveBeenCalled();
  });
});
