import { sql } from '../db.js';

export function deriveDefaultHouseholdName(user) {
  const name = user?.name?.trim();
  if (name) return `${name}'s Household`;

  const emailName = user?.email?.split('@')[0]?.trim();
  if (emailName) return `${emailName}'s Household`;

  return `Household ${user?.id ?? ''}`.trim();
}

export function deriveDefaultProfileName(user) {
  const name = user?.name?.trim();
  if (name) return name;

  const emailName = user?.email?.split('@')[0]?.trim();
  if (emailName) return emailName;

  return `Profile ${user?.id ?? ''}`.trim();
}

// The household the user belongs to, with their role. MVP assumes one
// household per user (their own, as owner); returns the lowest-id membership.
export async function findMembershipForUser(userId) {
  if (!userId) return null;
  const rows = await sql`
    SELECT household_id, role
    FROM household_members
    WHERE user_id = ${userId}
    ORDER BY household_id ASC
    LIMIT 1
  `;
  if (!rows[0]) return null;
  return { householdId: rows[0].household_id, role: rows[0].role };
}

export function isHouseholdManager(role) {
  return role === 'owner' || role === 'admin';
}

export async function ensureDefaultHouseholdForUser(user) {
  if (!user?.id) return null;

  const existing = await sql`
    SELECT *
    FROM households
    WHERE created_by_user_id = ${user.id}
    ORDER BY id ASC
    LIMIT 1
  `;

  const household = existing[0] ?? (
    await sql`
      INSERT INTO households (name, created_by_user_id)
      VALUES (${deriveDefaultHouseholdName(user)}, ${user.id})
      RETURNING *
    `
  )[0];

  await sql`
    INSERT INTO household_members (household_id, user_id, role)
    VALUES (${household.id}, ${user.id}, 'owner')
    ON CONFLICT (household_id, user_id) DO UPDATE
      SET role = 'owner'
  `;

  return household;
}

export async function ensurePrimaryProfileForUser(user) {
  if (!user?.id) return null;

  const household = await ensureDefaultHouseholdForUser(user);

  const rows = await sql`
    INSERT INTO profiles (
      household_id,
      source_user_id,
      managed_by_user_id,
      name,
      date_of_birth,
      age,
      height,
      weight,
      gender,
      activity_level,
      goal,
      goal_strategy,
      activity_focus,
      diet_style,
      units,
      daily_wins_active_keys,
      daily_wins_template_key,
      daily_wins_challenge_start_date,
      custom_protein,
      custom_fat,
      custom_carbs,
      custom_calories,
      is_dependent
    )
    VALUES (
      ${household.id},
      ${user.id},
      ${user.id},
      ${deriveDefaultProfileName(user)},
      ${user.dateOfBirth ?? null},
      ${user.age ?? null},
      ${user.height ?? null},
      ${user.weight ?? null},
      ${user.gender ?? null},
      ${user.activityLevel ?? null},
      ${user.goal ?? null},
      ${user.goalStrategy ?? null},
      ${user.activityFocus ?? []},
      ${user.dietStyle ?? 'balanced'},
      ${user.units ?? 'metric'},
      ${user.dailyWinsActiveKeys ?? []},
      ${user.dailyWinsTemplateKey ?? null},
      ${user.dailyWinsChallengeStartDate ?? null},
      ${user.customMacros?.protein ?? null},
      ${user.customMacros?.fat ?? null},
      ${user.customMacros?.carbs ?? null},
      ${user.customMacros?.calories ?? null},
      false
    )
    ON CONFLICT (source_user_id) DO UPDATE SET
      household_id = EXCLUDED.household_id,
      managed_by_user_id = EXCLUDED.managed_by_user_id,
      name = EXCLUDED.name,
      date_of_birth = EXCLUDED.date_of_birth,
      age = EXCLUDED.age,
      height = EXCLUDED.height,
      weight = EXCLUDED.weight,
      gender = EXCLUDED.gender,
      activity_level = EXCLUDED.activity_level,
      goal = EXCLUDED.goal,
      goal_strategy = EXCLUDED.goal_strategy,
      activity_focus = EXCLUDED.activity_focus,
      diet_style = EXCLUDED.diet_style,
      units = EXCLUDED.units,
      daily_wins_active_keys = EXCLUDED.daily_wins_active_keys,
      daily_wins_template_key = EXCLUDED.daily_wins_template_key,
      daily_wins_challenge_start_date = EXCLUDED.daily_wins_challenge_start_date,
      custom_protein = EXCLUDED.custom_protein,
      custom_fat = EXCLUDED.custom_fat,
      custom_carbs = EXCLUDED.custom_carbs,
      custom_calories = EXCLUDED.custom_calories,
      updated_at = NOW()
    RETURNING *
  `;

  return rows[0] ?? null;
}
