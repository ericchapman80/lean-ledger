import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireAdminUser = vi.fn();
const requireAdminUserId = vi.fn();
const listAll = vi.fn();
const findById = vi.fn();
const findByEmail = vi.fn();
const create = vi.fn();
const update = vi.fn();
const revoke = vi.fn();
const userFindByEmail = vi.fn();
const updateRole = vi.fn();

vi.mock('@/lib/accessControl', () => ({
  requireAdminUser,
  requireAdminUserId,
  normalizeMemberPayload: (body) => ({
    email: body.email?.trim().toLowerCase(),
    role: body.role === 'admin' ? 'admin' : 'member',
    note: body.note?.trim() || null,
  }),
}));

vi.mock('@/lib/models/allowedEmail', () => ({
  listAll,
  findById,
  findByEmail,
  create,
  update,
  revoke,
}));

vi.mock('@/lib/models/user', () => ({
  findByEmail: userFindByEmail,
  updateRole,
}));

describe('access member routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminUser.mockResolvedValue({ id: 1, email: 'eric@example.com', role: 'admin' });
    requireAdminUserId.mockResolvedValue(1);
  });

  it('lists members for admins', async () => {
    listAll.mockResolvedValue([{ id: 1, email: 'eric@example.com', role: 'admin' }]);

    const { GET } = await import('@/app/api/access/members/route.js');
    const response = await GET({});

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ id: 1, email: 'eric@example.com', role: 'admin' }]);
  });

  it('creates a new invite when the email is not already active', async () => {
    findByEmail.mockResolvedValue(null);
    create.mockResolvedValue({ id: 2, email: 'son@example.com', role: 'member', status: 'pending' });

    const { POST } = await import('@/app/api/access/members/route.js');
    const response = await POST({
      json: async () => ({ email: ' son@example.com ', role: 'member', note: 'family' }),
    });

    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledWith({
      email: 'son@example.com',
      role: 'member',
      note: 'family',
      invitedByUserId: 1,
    });
  });

  it('rejects duplicate active invites', async () => {
    findByEmail.mockResolvedValue({ id: 9, email: 'son@example.com', revokedAt: null });

    const { POST } = await import('@/app/api/access/members/route.js');
    const response = await POST({
      json: async () => ({ email: 'son@example.com', role: 'member' }),
    });

    expect(response.status).toBe(409);
    expect(create).not.toHaveBeenCalled();
  });

  it('updates member role and revocation state', async () => {
    findById.mockResolvedValue({ id: 4, email: 'member@example.com', role: 'member' });
    update.mockResolvedValue({ id: 4, email: 'member@example.com', role: 'admin', status: 'accepted' });
    userFindByEmail.mockResolvedValue({ id: 22, email: 'member@example.com', role: 'member' });

    const { PUT } = await import('@/app/api/access/members/[id]/route.js');
    const response = await PUT(
      { json: async () => ({ role: 'admin', revoke: false }) },
      { params: { id: '4' } },
    );

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalled();
    expect(updateRole).toHaveBeenCalledWith(22, 'admin');
  });

  it('revokes invited access', async () => {
    findById.mockResolvedValue({ id: 5, email: 'member@example.com', role: 'member' });
    revoke.mockResolvedValue({ id: 5, email: 'member@example.com', status: 'revoked' });

    const { DELETE } = await import('@/app/api/access/members/[id]/route.js');
    const response = await DELETE({}, { params: { id: '5' } });

    expect(response.status).toBe(200);
    expect(revoke).toHaveBeenCalledWith(5);
  });
});
