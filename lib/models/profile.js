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

// --- V2.2 Phase 3: management (create/update/remove dependent profiles) ---

export function formatProfile(row) {
  if (!row) return null;
  return {
    id: row.id,
    householdId: row.household_id,
    sourceUserId: row.source_user_id,
    managedByUserId: row.managed_by_user_id,
    name: row.name,
    dateOfBirth: row.date_of_birth,
    age: row.age,
    height: row.height,
    weight: row.weight,
    gender: row.gender,
    activityLevel: row.activity_level,
    goal: row.goal,
    goalStrategy: row.goal_strategy,
    activityFocus: row.activity_focus ?? [],
    dietStyle: row.diet_style,
    units: row.units,
    dailyWinsActiveKeys: row.daily_wins_active_keys ?? [],
    dailyWinsTemplateKey: row.daily_wins_template_key,
    dailyWinsChallengeStartDate: row.daily_wins_challenge_start_date,
    isDependent: row.is_dependent,
    isPrimary: row.source_user_id != null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listByHousehold(householdId) {
  const rows = await sql`
    SELECT * FROM profiles
    WHERE household_id = ${householdId}
    ORDER BY (source_user_id IS NULL), id ASC
  `;
  return rows.map(formatProfile);
}

export async function findByIdInHousehold(id, householdId) {
  const rows = await sql`
    SELECT * FROM profiles WHERE id = ${id} AND household_id = ${householdId}
  `;
  return formatProfile(rows[0]);
}

// Create a dependent (child/teen/other) profile in a household. Dependents have
// no auth identity (source_user_id stays NULL) and are managed by an adult.
export async function createDependent(data) {
  const rows = await sql`
    INSERT INTO profiles (
      household_id, source_user_id, managed_by_user_id, name,
      date_of_birth, age, height, weight, gender, activity_level, goal, goal_strategy,
      activity_focus, diet_style, units,
      daily_wins_active_keys, daily_wins_template_key, daily_wins_challenge_start_date,
      custom_protein, custom_fat, custom_carbs, custom_calories, is_dependent
    )
    VALUES (
      ${data.householdId}, NULL, ${data.managedByUserId}, ${data.name},
      ${data.dateOfBirth ?? null}, ${data.age ?? null}, ${data.height ?? null}, ${data.weight ?? null},
      ${data.gender ?? null}, ${data.activityLevel ?? null}, ${data.goal ?? null}, ${data.goalStrategy ?? null},
      ${data.activityFocus ?? []}, ${data.dietStyle ?? 'balanced'}, ${data.units ?? 'metric'},
      ${data.dailyWinsActiveKeys ?? []}, ${data.dailyWinsTemplateKey ?? null}, ${data.dailyWinsChallengeStartDate ?? null},
      ${data.customMacros?.protein ?? null}, ${data.customMacros?.fat ?? null}, ${data.customMacros?.carbs ?? null}, ${data.customMacros?.calories ?? null},
      true
    )
    RETURNING *
  `;
  return formatProfile(rows[0]);
}

// Update a profile's coaching fields, scoped to the household. Never touches
// household_id / source_user_id / managed_by_user_id.
export async function update(id, householdId, data) {
  const rows = await sql`
    UPDATE profiles SET
      name = COALESCE(${data.name ?? null}, name),
      date_of_birth = ${data.dateOfBirth ?? null},
      age = ${data.age ?? null},
      height = ${data.height ?? null},
      weight = ${data.weight ?? null},
      gender = ${data.gender ?? null},
      activity_level = ${data.activityLevel ?? null},
      goal = ${data.goal ?? null},
      goal_strategy = ${data.goalStrategy ?? null},
      activity_focus = ${data.activityFocus ?? []},
      diet_style = ${data.dietStyle ?? 'balanced'},
      units = ${data.units ?? 'metric'},
      daily_wins_active_keys = ${data.dailyWinsActiveKeys ?? []},
      daily_wins_template_key = ${data.dailyWinsTemplateKey ?? null},
      daily_wins_challenge_start_date = ${data.dailyWinsChallengeStartDate ?? null},
      custom_protein = ${data.customMacros?.protein ?? null},
      custom_fat = ${data.customMacros?.fat ?? null},
      custom_carbs = ${data.customMacros?.carbs ?? null},
      custom_calories = ${data.customMacros?.calories ?? null},
      updated_at = NOW()
    WHERE id = ${id} AND household_id = ${householdId}
    RETURNING *
  `;
  return formatProfile(rows[0]);
}

// Remove a dependent profile only. The guard `source_user_id IS NULL` makes it
// impossible to delete a primary (real-user) profile through this path, and the
// household_id scope prevents cross-household deletes.
export async function removeDependent(id, householdId) {
  const rows = await sql`
    DELETE FROM profiles
    WHERE id = ${id} AND household_id = ${householdId} AND source_user_id IS NULL AND is_dependent = true
    RETURNING id
  `;
  return rows.length > 0;
}
