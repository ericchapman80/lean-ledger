import { sql } from '../db.js';

function normalizeEmail(email) {
  return email?.trim().toLowerCase() || '';
}

function formatInvitation(row) {
  if (!row) return null;

  const acceptedAt = row.accepted_at ?? null;
  const declinedAt = row.declined_at ?? null;
  const revokedAt = row.revoked_at ?? null;

  let status = 'pending';
  if (revokedAt) status = 'revoked';
  else if (declinedAt) status = 'declined';
  else if (acceptedAt) status = 'accepted';

  return {
    id: row.id,
    householdId: row.household_id,
    invitedEmail: row.invited_email,
    invitedUserId: row.invited_user_id ?? null,
    invitedByUserId: row.invited_by_user_id ?? null,
    role: row.role,
    note: row.note ?? null,
    acceptedAt,
    declinedAt,
    revokedAt,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status,
    householdName: row.household_name ?? null,
    inviterName: row.inviter_name ?? null,
  };
}

export async function findById(id) {
  const rows = await sql`
    SELECT hli.*, h.name AS household_name, inviter.name AS inviter_name
    FROM household_link_invitations hli
    JOIN households h ON h.id = hli.household_id
    LEFT JOIN users inviter ON inviter.id = hli.invited_by_user_id
    WHERE hli.id = ${id}
    LIMIT 1
  `;
  return formatInvitation(rows[0]);
}

export async function findActiveByHouseholdAndEmail(householdId, email) {
  const normalizedEmail = normalizeEmail(email);
  const rows = await sql`
    SELECT *
    FROM household_link_invitations
    WHERE household_id = ${householdId}
      AND lower(invited_email) = ${normalizedEmail}
      AND accepted_at IS NULL
      AND declined_at IS NULL
      AND revoked_at IS NULL
    LIMIT 1
  `;
  return formatInvitation(rows[0]);
}

export async function createInvitation({ householdId, invitedEmail, invitedUserId = null, invitedByUserId, role = 'member', note = null }) {
  const normalizedEmail = normalizeEmail(invitedEmail);
  const rows = await sql`
    INSERT INTO household_link_invitations (
      household_id, invited_email, invited_user_id, invited_by_user_id, role, note
    )
    VALUES (
      ${householdId}, ${normalizedEmail}, ${invitedUserId}, ${invitedByUserId}, ${role}, ${note?.trim() || null}
    )
    RETURNING *
  `;
  return formatInvitation(rows[0]);
}

export async function listSentForHousehold(householdId) {
  const rows = await sql`
    SELECT hli.*, h.name AS household_name, inviter.name AS inviter_name
    FROM household_link_invitations hli
    JOIN households h ON h.id = hli.household_id
    LEFT JOIN users inviter ON inviter.id = hli.invited_by_user_id
    WHERE hli.household_id = ${householdId}
    ORDER BY hli.created_at DESC
  `;
  return rows.map(formatInvitation);
}

export async function listReceivedForUser({ userId = null, email = null }) {
  const normalizedEmail = normalizeEmail(email);
  const rows = await sql`
    SELECT hli.*, h.name AS household_name, inviter.name AS inviter_name
    FROM household_link_invitations hli
    JOIN households h ON h.id = hli.household_id
    LEFT JOIN users inviter ON inviter.id = hli.invited_by_user_id
    WHERE (
      ${userId ?? null} IS NOT NULL AND hli.invited_user_id = ${userId ?? null}
    ) OR (
      ${normalizedEmail || null} IS NOT NULL AND lower(hli.invited_email) = ${normalizedEmail || null}
    )
    ORDER BY hli.created_at DESC
  `;
  return rows.map(formatInvitation);
}

export async function markAccepted(id) {
  const rows = await sql`
    UPDATE household_link_invitations
    SET
      accepted_at = COALESCE(accepted_at, NOW()),
      declined_at = NULL,
      revoked_at = NULL,
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return formatInvitation(rows[0]);
}

export async function markDeclined(id) {
  const rows = await sql`
    UPDATE household_link_invitations
    SET
      declined_at = NOW(),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return formatInvitation(rows[0]);
}

export async function revoke(id) {
  const rows = await sql`
    UPDATE household_link_invitations
    SET
      revoked_at = NOW(),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return formatInvitation(rows[0]);
}
