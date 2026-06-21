import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({ getCurrentUserId: vi.fn() }));
vi.mock('@/lib/activeProfile', () => ({ getActiveProfileId: vi.fn() }));
vi.mock('@/lib/models/profile', () => ({ findById: vi.fn() }));
vi.mock('@/lib/models/weight', () => ({ findByProfile: vi.fn() }));
vi.mock('@/lib/models/healthMetric', () => ({ findByProfile: vi.fn() }));
vi.mock('@/lib/models/bodyCompositionGoal', () => ({
  findActiveByProfile: vi.fn(),
  listHistoryByProfile: vi.fn(),
  create: vi.fn(),
  findByIdForProfile: vi.fn(),
  update: vi.fn(),
  complete: vi.fn(),
  archive: vi.fn(),
}));
vi.mock('@/lib/models/profileHousehold', () => ({
  findMembershipForUser: vi.fn(),
  isHouseholdManager: (role) => role === 'owner' || role === 'admin',
}));

import { getCurrentUserId } from '@/lib/auth';
import { getActiveProfileId } from '@/lib/activeProfile';
import * as Profile from '@/lib/models/profile';
import * as Weight from '@/lib/models/weight';
import * as HealthMetric from '@/lib/models/healthMetric';
import * as BodyCompositionGoal from '@/lib/models/bodyCompositionGoal';
import { findMembershipForUser } from '@/lib/models/profileHousehold';

const USER_ID = 1;
const PROFILE_ID = 7;

function req(body) {
  return { json: async () => body };
}

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUserId.mockResolvedValue(USER_ID);
  getActiveProfileId.mockResolvedValue(PROFILE_ID);
  findMembershipForUser.mockResolvedValue({ householdId: 5, role: 'owner' });
  Profile.findById.mockResolvedValue({
    id: PROFILE_ID,
    householdId: 5,
    sourceUserId: USER_ID,
    dateOfBirth: '1980-08-17',
    age: 45,
  });
  Weight.findByProfile.mockResolvedValue([{ date: '2026-06-20', weight: 97.6 }]);
  HealthMetric.findByProfile.mockResolvedValue([{
    recordedAt: '2026-06-20T07:00:00',
    weight: 97.6,
    bodyFatPercent: 17.2,
    muscleMass: 76.8,
  }]);
  BodyCompositionGoal.listHistoryByProfile.mockResolvedValue([]);
});

describe('GET /api/body-composition-goals', () => {
  it('returns active goal plus history for the active profile', async () => {
    BodyCompositionGoal.findActiveByProfile.mockResolvedValue({
      id: 1,
      profileId: PROFILE_ID,
      name: 'Project 200',
      phaseType: 'cut',
      goalWeight: 90.7,
      goalBodyFatPercent: 12,
      minimumLeanMass: 79.8,
      minimumMuscleMass: 76.2,
      baselineRecordedAt: '2026-06-20T07:00:00',
      baselineWeight: 97.6,
      baselineBodyFatPercent: 17.2,
      baselineFatMass: 16.8,
      baselineLeanMass: 80.8,
      baselineMuscleMass: 76.8,
    });
    const { GET } = await import('@/app/api/body-composition-goals/route.js');
    const res = await GET({});
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.activeGoal.name).toBe('Project 200');
    expect(body.history).toEqual([]);
  });
});

describe('POST /api/body-composition-goals', () => {
  it('creates a cut goal with a frozen baseline snapshot', async () => {
    BodyCompositionGoal.findActiveByProfile.mockResolvedValue(null);
    BodyCompositionGoal.create.mockResolvedValue({
      id: 1,
      profileId: PROFILE_ID,
      name: 'Project 200',
      phaseType: 'cut',
      goalWeight: 90.7,
      goalBodyFatPercent: 12,
      minimumLeanMass: 79.8,
      minimumMuscleMass: 76.2,
      targetDate: '2026-12-31',
      baselineRecordedAt: '2026-06-20T07:00:00',
      baselineWeight: 97.6,
      baselineBodyFatPercent: 17.2,
      baselineFatMass: 16.8,
      baselineLeanMass: 80.8,
      baselineMuscleMass: 76.8,
    });
    const { POST } = await import('@/app/api/body-composition-goals/route.js');
    const res = await POST(req({
      name: 'Project 200',
      phaseType: 'cut',
      goalWeight: 90.7,
      goalBodyFatPercent: 12,
      minimumLeanMass: 79.8,
      minimumMuscleMass: 76.2,
      targetDate: '2026-12-31',
    }));
    expect(res.status).toBe(201);
    expect(BodyCompositionGoal.create).toHaveBeenCalledWith(expect.objectContaining({
      profileId: PROFILE_ID,
      baselineRecordedAt: '2026-06-20T07:00:00',
      baselineLeanMass: 80.8,
    }));
  });

  it('rejects a second active goal', async () => {
    BodyCompositionGoal.findActiveByProfile.mockResolvedValue({ id: 99 });
    const { POST } = await import('@/app/api/body-composition-goals/route.js');
    const res = await POST(req({ phaseType: 'cut', goalWeight: 90.7, targetDate: '2026-12-31' }));
    expect(res.status).toBe(409);
  });

  it('rejects cut goals for child profiles', async () => {
    BodyCompositionGoal.findActiveByProfile.mockResolvedValue(null);
    Profile.findById.mockResolvedValue({
      id: PROFILE_ID,
      householdId: 5,
      sourceUserId: USER_ID,
      dateOfBirth: '2018-01-01',
      age: 8,
    });
    const { POST } = await import('@/app/api/body-composition-goals/route.js');
    const res = await POST(req({ phaseType: 'cut', goalWeight: 40, targetDate: '2026-12-31' }));
    expect(res.status).toBe(403);
  });
});

describe('goal lifecycle routes', () => {
  beforeEach(() => {
    BodyCompositionGoal.findByIdForProfile.mockResolvedValue({
      id: 1,
      profileId: PROFILE_ID,
      name: 'Project 200',
      phaseType: 'cut',
      goalWeight: 90.7,
      goalBodyFatPercent: 12,
      minimumLeanMass: 79.8,
      minimumMuscleMass: 76.2,
      targetDate: '2026-12-31',
    });
  });

  it('updates an active goal', async () => {
    BodyCompositionGoal.update.mockResolvedValue({ id: 1, name: 'Project 200 v2' });
    const { PATCH } = await import('@/app/api/body-composition-goals/[id]/route.js');
    const res = await PATCH(req({ name: 'Project 200 v2' }), { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(200);
    expect(BodyCompositionGoal.update).toHaveBeenCalled();
  });

  it('completes an active goal with a current snapshot', async () => {
    BodyCompositionGoal.complete.mockResolvedValue({ id: 1, completedAt: '2026-07-01T10:00:00Z' });
    const { POST } = await import('@/app/api/body-composition-goals/[id]/complete/route.js');
    const res = await POST({}, { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(200);
    expect(BodyCompositionGoal.complete).toHaveBeenCalledWith(1, PROFILE_ID, expect.objectContaining({
      completionRecordedAt: '2026-06-20T07:00:00',
    }));
  });

  it('archives an active goal', async () => {
    BodyCompositionGoal.archive.mockResolvedValue({ id: 1, archivedAt: '2026-07-01T10:00:00Z' });
    const { POST } = await import('@/app/api/body-composition-goals/[id]/archive/route.js');
    const res = await POST({}, { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(200);
    expect(BodyCompositionGoal.archive).toHaveBeenCalledWith(1, PROFILE_ID);
  });
});
