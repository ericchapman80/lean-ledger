import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sqlMock } = vi.hoisted(() => ({
  sqlMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  sql: sqlMock,
}));

import { listReceivedForUser } from '@/lib/models/householdLinkInvitation';

describe('householdLinkInvitation.listReceivedForUser', () => {
  beforeEach(() => {
    sqlMock.mockReset();
    sqlMock.mockResolvedValue([]);
  });

  it('returns an empty list without querying when both userId and email are absent', async () => {
    const rows = await listReceivedForUser({ userId: null, email: null });

    expect(rows).toEqual([]);
    expect(sqlMock).not.toHaveBeenCalled();
  });

  it('queries safely when only userId is present', async () => {
    await listReceivedForUser({ userId: 42, email: null });

    expect(sqlMock).toHaveBeenCalledTimes(1);
    const [, userId] = sqlMock.mock.calls[0];
    expect(userId).toBe(42);
    expect(sqlMock.mock.calls[0].includes(null)).toBe(false);
  });

  it('queries safely when only email is present', async () => {
    await listReceivedForUser({ userId: null, email: 'Konnor@Example.com' });

    expect(sqlMock).toHaveBeenCalledTimes(1);
    const [, email] = sqlMock.mock.calls[0];
    expect(email).toBe('konnor@example.com');
    expect(sqlMock.mock.calls[0].includes(null)).toBe(false);
  });
});
