import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({ getCurrentUserId: vi.fn() }));
vi.mock('@/lib/activeProfile', () => ({ getActiveProfileId: vi.fn(), resolveActiveCoachingSubject: vi.fn() }));
vi.mock('@/lib/models/user', () => ({ findById: vi.fn(), update: vi.fn() }));
vi.mock('@/lib/models/healthMetric', () => ({
  upsert: vi.fn(),
  findByProfile: vi.fn(),
  findByProfileAndDateRange: vi.fn(),
}));
vi.mock('@/lib/models/weight', () => ({ upsert: vi.fn() }));
vi.mock('@/lib/healthMetrics', () => ({
  validateHealthMetricEntry: vi.fn((body) => ({ normalized: body, errors: [] })),
}));

import { getCurrentUserId } from '@/lib/auth';
import { getActiveProfileId, resolveActiveCoachingSubject } from '@/lib/activeProfile';
import * as User from '@/lib/models/user';
import * as HealthMetric from '@/lib/models/healthMetric';
import * as Weight from '@/lib/models/weight';

const USER_ID = 1;
const PROFILE_ID = 7;

function req(body) {
  return {
    url: 'http://localhost/api/health-metrics',
    json: async () => body,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUserId.mockResolvedValue(USER_ID);
  getActiveProfileId.mockResolvedValue(PROFILE_ID);
  resolveActiveCoachingSubject.mockResolvedValue({ isPrimary: true });
  User.findById.mockResolvedValue({ id: USER_ID, weight: 70, units: 'metric' });
});

describe('POST /api/health-metrics', () => {
  it('syncs user weight only for the signed-in user primary profile', async () => {
    HealthMetric.upsert.mockResolvedValue({ id: 1 });
    Weight.upsert.mockResolvedValue({ id: 11 });
    const { POST } = await import('@/app/api/health-metrics/route.js');

    const res = await POST(req({ date: '2030-01-02', weight: 81 }));

    expect(res.status).toBe(201);
    expect(Weight.upsert).toHaveBeenCalledWith({ userId: USER_ID, profileId: PROFILE_ID, date: '2030-01-02', weight: 81 });
    expect(User.update).toHaveBeenCalledWith(USER_ID, expect.objectContaining({ weight: 81 }));
  });

  it('does not overwrite the signed-in user weight when the active profile is a dependent', async () => {
    resolveActiveCoachingSubject.mockResolvedValue({ isPrimary: false });
    HealthMetric.upsert.mockResolvedValue({ id: 1 });
    Weight.upsert.mockResolvedValue({ id: 11 });
    const { POST } = await import('@/app/api/health-metrics/route.js');

    const res = await POST(req({ date: '2030-01-02', weight: 42 }));

    expect(res.status).toBe(201);
    expect(Weight.upsert).toHaveBeenCalledWith({ userId: USER_ID, profileId: PROFILE_ID, date: '2030-01-02', weight: 42 });
    expect(User.update).not.toHaveBeenCalled();
  });
});
