import * as AllowedEmail from './models/allowedEmail.js';
import * as User from './models/user.js';
import { getCurrentUserId } from './auth.js';

const VALID_ROLES = ['admin', 'member'];

export function normalizeMemberPayload(input = {}) {
  const email = AllowedEmail.normalizeAllowedEmail(input.email);
  const role = VALID_ROLES.includes(input.role) ? input.role : 'member';
  const note = input.note?.trim() || null;

  return { email, role, note };
}

export function canAccessByInvite(invite) {
  return Boolean(invite && !invite.revokedAt);
}

export function getAccessDeniedRedirect() {
  return '/login?reason=access-denied';
}

export async function requireAdminUserId(request) {
  const userId = await getCurrentUserId(request);
  const user = await User.findById(userId);

  if (!user || user.role !== 'admin') {
    const error = new Error('Admin access required.');
    error.status = 403;
    throw error;
  }

  return userId;
}

export async function requireAdminUser(request) {
  const userId = await getCurrentUserId(request);
  const user = await User.findById(userId);

  if (!user || user.role !== 'admin') {
    const error = new Error('Admin access required.');
    error.status = 403;
    throw error;
  }

  return user;
}
