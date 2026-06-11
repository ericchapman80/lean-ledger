import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sqlMock } = vi.hoisted(() => ({ sqlMock: vi.fn() }));
vi.mock('@/lib/db', () => ({ sql: sqlMock }));

import {
  findById,
  findPrimaryByUserId,
  findByHousehold,
  findAccessibleByUserId,
  isAccessibleToUser,
} from '@/lib/models/profile.js';

beforeEach(() => {
  sqlMock.mockReset();
});

describe('findById', () => {
  it('returns a formatted profile when found and null otherwise', async () => {
    sqlMock.mockResolvedValueOnce([{ id: 5, name: 'Kid', source_user_id: null, is_dependent: true }]);
    const found = await findById(5);
    expect(found.id).toBe(5);
    expect(found.name).toBe('Kid');
    expect(found.isPrimary).toBe(false);

    sqlMock.mockResolvedValueOnce([]);
    expect(await findById(99)).toBeNull();
  });
});

describe('findPrimaryByUserId', () => {
  it('queries by source_user_id and returns the first row', async () => {
    sqlMock.mockResolvedValueOnce([{ id: 1, source_user_id: 1 }]);
    const row = await findPrimaryByUserId(1);
    expect(row.id).toBe(1);
    expect(sqlMock.mock.calls[0][0].join(' ')).toContain('source_user_id');
  });

  it('returns null when the user has no primary profile', async () => {
    sqlMock.mockResolvedValueOnce([]);
    expect(await findPrimaryByUserId(7)).toBeNull();
  });
});

describe('findByHousehold', () => {
  it('scopes by household_id and returns all rows', async () => {
    sqlMock.mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);
    const rows = await findByHousehold(3);
    expect(rows).toHaveLength(2);
    expect(sqlMock.mock.calls[0][0].join(' ')).toContain('household_id');
  });
});

describe('findAccessibleByUserId', () => {
  it('joins household_members so only the caller\'s households are visible', async () => {
    sqlMock.mockResolvedValueOnce([{ id: 1 }]);
    await findAccessibleByUserId(1);
    const text = sqlMock.mock.calls[0][0].join(' ');
    expect(text).toContain('household_members');
    expect(text).toContain('hm.user_id');
  });
});

describe('isAccessibleToUser', () => {
  it('is true only when a household membership links the profile to the user', async () => {
    sqlMock.mockResolvedValueOnce([{ ok: 1 }]);
    expect(await isAccessibleToUser(5, 1)).toBe(true);

    sqlMock.mockResolvedValueOnce([]);
    expect(await isAccessibleToUser(5, 2)).toBe(false);

    const text = sqlMock.mock.calls[0][0].join(' ');
    expect(text).toContain('household_members');
  });
});
