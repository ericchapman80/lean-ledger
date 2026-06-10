import { sql } from '../db.js';

// Read model for V2.2 Family Profiles.
// `profiles` carries each coaching profile's domain state; access is scoped to
// the households the requesting user belongs to (via `household_members`).
// Rows are returned raw (snake_case) for now — API/UI formatting lands with the
// management endpoints in a later phase.

export async function findById(id) {
  const rows = await sql`SELECT * FROM profiles WHERE id = ${id}`;
  return rows[0] ?? null;
}

// The profile that mirrors a real auth user (their own profile), as created by
// the household/profile backfill and `ensurePrimaryProfileForUser`.
export async function findPrimaryByUserId(userId) {
  const rows = await sql`
    SELECT * FROM profiles
    WHERE source_user_id = ${userId}
    ORDER BY id ASC
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function findByHousehold(householdId) {
  return sql`
    SELECT * FROM profiles
    WHERE household_id = ${householdId}
    ORDER BY id ASC
  `;
}

// Every profile in any household the user is a member of — the set of profiles
// the user is allowed to see/switch between.
export async function findAccessibleByUserId(userId) {
  return sql`
    SELECT p.*
    FROM profiles p
    JOIN household_members hm ON hm.household_id = p.household_id
    WHERE hm.user_id = ${userId}
    ORDER BY p.id ASC
  `;
}

// Authorization predicate: is this profile in a household the user belongs to?
export async function isAccessibleToUser(profileId, userId) {
  const rows = await sql`
    SELECT 1
    FROM profiles p
    JOIN household_members hm ON hm.household_id = p.household_id
    WHERE p.id = ${profileId} AND hm.user_id = ${userId}
    LIMIT 1
  `;
  return rows.length > 0;
}
