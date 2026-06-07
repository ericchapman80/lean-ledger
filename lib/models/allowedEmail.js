import { sql } from '../db.js';

export function normalizeAllowedEmail(email) {
  const normalized = email?.trim().toLowerCase() || '';
  if (!normalized || !normalized.includes('@')) {
    throw new Error('A valid email is required.');
  }
  return normalized;
}

function formatAllowedEmail(row) {
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    role: row.role,
    invitedByUserId: row.invited_by_user_id,
    note: row.note ?? null,
    createdAt: row.created_at,
    acceptedAt: row.accepted_at ?? null,
    revokedAt: row.revoked_at ?? null,
    status: row.revoked_at ? 'revoked' : row.accepted_at ? 'accepted' : 'pending',
  };
}

export async function findByEmail(email) {
  const normalized = normalizeAllowedEmail(email);
  const rows = await sql`
    SELECT *
    FROM allowed_emails
    WHERE email = ${normalized}
    LIMIT 1
  `;
  return formatAllowedEmail(rows[0]);
}

export async function findById(id) {
  const rows = await sql`
    SELECT *
    FROM allowed_emails
    WHERE id = ${id}
    LIMIT 1
  `;
  return formatAllowedEmail(rows[0]);
}

export async function listAll() {
  const rows = await sql`
    SELECT *
    FROM allowed_emails
    ORDER BY
      CASE WHEN revoked_at IS NULL THEN 0 ELSE 1 END,
      created_at DESC
  `;
  return rows.map(formatAllowedEmail);
}

export async function create({ email, role = 'member', invitedByUserId = null, note = null }) {
  const normalized = normalizeAllowedEmail(email);
  const rows = await sql`
    INSERT INTO allowed_emails (email, role, invited_by_user_id, note)
    VALUES (${normalized}, ${role}, ${invitedByUserId}, ${note?.trim() || null})
    RETURNING *
  `;
  return formatAllowedEmail(rows[0]);
}

export async function update(id, { role, note, revokedAt = undefined, acceptedAt = undefined }) {
  const rows = await sql`
    UPDATE allowed_emails
    SET
      role = COALESCE(${role}, role),
      note = COALESCE(${note?.trim?.() ?? note ?? null}, note),
      revoked_at = CASE
        WHEN ${revokedAt === undefined} THEN revoked_at
        ELSE ${revokedAt}
      END,
      accepted_at = CASE
        WHEN ${acceptedAt === undefined} THEN accepted_at
        ELSE ${acceptedAt}
      END
    WHERE id = ${id}
    RETURNING *
  `;
  return formatAllowedEmail(rows[0]);
}

export async function revoke(id) {
  return update(id, { revokedAt: new Date().toISOString() });
}

export async function markAccepted(email) {
  const normalized = normalizeAllowedEmail(email);
  const rows = await sql`
    UPDATE allowed_emails
    SET
      accepted_at = COALESCE(accepted_at, NOW()),
      revoked_at = NULL
    WHERE email = ${normalized}
    RETURNING *
  `;
  return formatAllowedEmail(rows[0]);
}
