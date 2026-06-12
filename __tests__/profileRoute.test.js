import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({ getCurrentUserId: vi.fn() }));
vi.mock('@/lib/models/user', () => ({
  findById: vi.fn(),
  update: vi.fn(),
  createWithId: vi.fn(),
}));
vi.mock('@/lib/profile', async () => {
  const actual = await vi.importActual('@/lib/profile.js');
  return {
    ...actual,
    validateProfilePayload: vi.fn(() => null),
  };
});

import { getCurrentUserId } from '@/lib/auth';
import * as User from '@/lib/models/user';
import { validateProfilePayload } from '@/lib/profile';

const USER_ID = 1;

function req(body) {
  return {
    json: async () => body,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUserId.mockResolvedValue(USER_ID);
});

describe('GET /api/profile', () => {
  it('returns the signed-in user profile even if a household child is active elsewhere', async () => {
    User.findById.mockResolvedValue({
      id: USER_ID,
      dateOfBirth: '1980-08-17',
      age: 45,
      height: 190.5,
      weight: 79.4,
      gender: 'male',
      activityLevel: 'moderate',
      goal: 'maintain',
      goalStrategy: 'maintenance',
      activityFocus: ['general_fitness'],
      dietStyle: 'balanced',
      units: 'imperial',
      dailyWinsActiveKeys: [],
      customMacros: null,
    });

    const { GET } = await import('@/app/api/profile/route.js');
    const res = await GET({});
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(User.findById).toHaveBeenCalledWith(USER_ID);
    expect(body.dateOfBirth).toBe('1980-08-17');
    expect(body.units).toBe('imperial');
  });

  it('returns needsProfile when the signed-in user has not completed setup', async () => {
    User.findById.mockResolvedValue(null);

    const { GET } = await import('@/app/api/profile/route.js');
    const res = await GET({});
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.needsProfile).toBe(true);
  });
});

describe('POST /api/profile', () => {
  const validPayload = {
    dateOfBirth: '1980-08-17',
    age: 45,
    height: 190.5,
    weight: 79.4,
    gender: 'male',
    activityLevel: 'moderate',
    goal: 'maintain',
    goalStrategy: 'maintenance',
    activityFocus: ['general_fitness'],
    dietStyle: 'balanced',
    units: 'imperial',
    dailyWinsActiveKeys: [],
    customMacros: null,
  };

  it('always updates the signed-in user row', async () => {
    User.findById.mockResolvedValue({ id: USER_ID });
    User.update.mockResolvedValue({
      id: USER_ID,
      ...validPayload,
    });

    const { POST } = await import('@/app/api/profile/route.js');
    const res = await POST(req(validPayload));
    const body = await res.json();

    expect(validateProfilePayload).toHaveBeenCalledWith(validPayload);
    expect(User.update).toHaveBeenCalledWith(USER_ID, validPayload);
    expect(res.status).toBe(200);
    expect(body.dateOfBirth).toBe('1980-08-17');
  });

  it('creates the signed-in user row when missing', async () => {
    User.findById.mockResolvedValue(null);
    User.createWithId.mockResolvedValue({
      id: USER_ID,
      ...validPayload,
    });

    const { POST } = await import('@/app/api/profile/route.js');
    const res = await POST(req(validPayload));

    expect(User.createWithId).toHaveBeenCalledWith(USER_ID, validPayload);
    expect(res.status).toBe(200);
  });
});
