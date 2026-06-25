import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({ getCurrentUserId: vi.fn() }));
vi.mock('@/lib/activeProfile', () => ({ getActiveProfileId: vi.fn() }));
vi.mock('@/lib/models/user', () => ({ findById: vi.fn() }));
vi.mock('@/lib/models/performanceMetric', () => ({
  create: vi.fn(),
  findByProfile: vi.fn(),
  deleteByIdForProfile: vi.fn(),
}));

import { getCurrentUserId } from '@/lib/auth';
import { getActiveProfileId } from '@/lib/activeProfile';
import * as User from '@/lib/models/user';
import * as PerformanceMetric from '@/lib/models/performanceMetric';

const USER_ID = 1;
const PROFILE_ID = 7;

function jsonRequest(body, url = 'http://localhost/api/performance-metrics') {
  return {
    url,
    json: async () => body,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUserId.mockResolvedValue(USER_ID);
  getActiveProfileId.mockResolvedValue(PROFILE_ID);
  User.findById.mockResolvedValue({ id: USER_ID, units: 'imperial' });
});

describe('GET /api/performance-metrics', () => {
  it('returns profile-scoped performance metrics for the requested range', async () => {
    PerformanceMetric.findByProfile.mockResolvedValue([{ id: 1, metricKey: 'bench_press' }]);
    const { GET } = await import('@/app/api/performance-metrics/route.js');

    const res = await GET({
      url: 'http://localhost/api/performance-metrics?startDate=2026-06-01&endDate=2026-06-24&limit=25',
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual([{ id: 1, metricKey: 'bench_press' }]);
    expect(PerformanceMetric.findByProfile).toHaveBeenCalledWith(PROFILE_ID, {
      startDate: '2026-06-01',
      endDate: '2026-06-24',
      limit: 25,
    });
  });
});

describe('POST /api/performance-metrics', () => {
  it('creates a canonical performance metric for the active profile', async () => {
    PerformanceMetric.create.mockResolvedValue({ id: 1, metricKey: 'bench_press', value: 102.1 });
    const { POST } = await import('@/app/api/performance-metrics/route.js');

    const res = await POST(jsonRequest({
      metricKey: 'bench_press',
      recordedAt: '2026-06-24T07:00',
      value: 225,
      reps: 5,
      note: 'Top set',
    }));

    expect(res.status).toBe(201);
    expect(PerformanceMetric.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: USER_ID,
      profileId: PROFILE_ID,
      metricKey: 'bench_press',
      value: expect.closeTo(102.1, 1),
      unit: 'kg',
      reps: 5,
    }));
  });

  it('rejects invalid payloads with a 400', async () => {
    const { POST } = await import('@/app/api/performance-metrics/route.js');

    const res = await POST(jsonRequest({
      metricKey: 'vertical_jump',
      recordedAt: '2026-06-24T07:00',
      value: 28,
      reps: 3,
    }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Reps are not supported for this performance metric.');
    expect(PerformanceMetric.create).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/performance-metrics/[id]', () => {
  it('deletes a performance metric scoped to the active profile', async () => {
    PerformanceMetric.deleteByIdForProfile.mockResolvedValue({ id: 12 });
    const { DELETE } = await import('@/app/api/performance-metrics/[id]/route.js');

    const res = await DELETE({}, { params: Promise.resolve({ id: '12' }) });
    expect(res.status).toBe(200);
    expect(PerformanceMetric.deleteByIdForProfile).toHaveBeenCalledWith(12, PROFILE_ID);
  });

  it('returns 404 when the entry does not exist for the active profile', async () => {
    PerformanceMetric.deleteByIdForProfile.mockResolvedValue(null);
    const { DELETE } = await import('@/app/api/performance-metrics/[id]/route.js');

    const res = await DELETE({}, { params: Promise.resolve({ id: '12' }) });
    expect(res.status).toBe(404);
  });
});
