import { sql } from '../db.js';
import { DEFAULT_ACTIVE_DAILY_WIN_KEYS } from '../dailyWins.js';
import {
  calculateAgeFromDateOfBirth,
  mapGoalStrategyToLegacyGoal,
  normalizeActivityFocus,
} from '../coachingProfile.js';

export async function findById(id) {
  const rows = await sql`SELECT * FROM users WHERE id = ${id}`;
  return rows[0] ? formatUser(rows[0]) : null;
}

export async function findByEmail(email) {
  const rows = await sql`SELECT * FROM users WHERE lower(email) = lower(${email})`;
  return rows[0] ? formatUser(rows[0]) : null;
}

export async function createWithId(id, data) {
  const profile = normalizeProfileData(data);
  const dailyWinsActiveKeys = data.dailyWinsActiveKeys ?? DEFAULT_ACTIVE_DAILY_WIN_KEYS;
  const rows = await sql`
    INSERT INTO users (
      id, name, email, "emailVerified", image,
      role, date_of_birth,
      age, height, weight, gender, activity_level, goal, diet_style, units,
      goal_strategy, activity_focus,
      custom_protein, custom_fat, custom_carbs, custom_calories, daily_wins_active_keys,
      daily_wins_template_key, daily_wins_challenge_start_date
    ) VALUES (
      ${id},
      ${data.name ?? null},
      ${data.email ?? null},
      ${data.emailVerified ?? null},
      ${data.image ?? null},
      ${data.role ?? 'member'},
      ${profile.dateOfBirth},
      ${profile.age},
      ${profile.height},
      ${profile.weight},
      ${profile.gender},
      ${profile.activityLevel},
      ${profile.goal},
      ${profile.dietStyle},
      ${profile.units},
      ${profile.goalStrategy},
      ${profile.activityFocus},
      ${data.customMacros?.protein ?? null},
      ${data.customMacros?.fat ?? null},
      ${data.customMacros?.carbs ?? null},
      ${data.customMacros?.calories ?? null},
      ${dailyWinsActiveKeys},
      ${data.dailyWinsTemplateKey ?? null},
      ${data.dailyWinsChallengeStartDate ?? null}
    )
    RETURNING *
  `;
  return formatUser(rows[0]);
}

export async function update(id, data) {
  const profile = normalizeProfileData(data);
  const dailyWinsActiveKeys = data.dailyWinsActiveKeys ?? DEFAULT_ACTIVE_DAILY_WIN_KEYS;
  const rows = await sql`
    UPDATE users SET
      date_of_birth   = ${profile.dateOfBirth},
      age             = ${profile.age},
      height          = ${profile.height},
      weight          = ${profile.weight},
      gender          = ${profile.gender},
      activity_level  = ${profile.activityLevel},
      goal            = ${profile.goal},
      goal_strategy   = ${profile.goalStrategy},
      activity_focus  = ${profile.activityFocus},
      diet_style      = ${profile.dietStyle},
      units           = ${profile.units},
      custom_protein  = ${data.customMacros?.protein ?? null},
      custom_fat      = ${data.customMacros?.fat ?? null},
      custom_carbs    = ${data.customMacros?.carbs ?? null},
      custom_calories = ${data.customMacros?.calories ?? null},
      daily_wins_active_keys = ${dailyWinsActiveKeys},
      daily_wins_template_key = ${data.dailyWinsTemplateKey ?? null},
      daily_wins_challenge_start_date = ${data.dailyWinsChallengeStartDate ?? null},
      role            = COALESCE(${data.role ?? null}, role),
      updated_at      = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] ? formatUser(rows[0]) : null;
}

export async function updateRole(id, role) {
  const rows = await sql`
    UPDATE users
    SET
      role = ${role},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] ? formatUser(rows[0]) : null;
}

export function normalizeProfileData(data) {
  const goalStrategy = data.goalStrategy ?? 'maintenance';
  const dateOfBirth = data.dateOfBirth ?? null;
  const age = data.age ?? calculateAgeFromDateOfBirth(dateOfBirth);

  return {
    dateOfBirth,
    age,
    height: data.height ?? null,
    weight: data.weight ?? null,
    gender: data.gender ?? null,
    activityLevel: data.activityLevel ?? null,
    goal: data.goal ?? mapGoalStrategyToLegacyGoal(goalStrategy),
    goalStrategy,
    activityFocus: normalizeActivityFocus(data.activityFocus),
    dietStyle: data.dietStyle || 'balanced',
    units: data.units || 'metric',
  };
}

function formatUser(row) {
  return {
    id: row.id,
    name: row.name ?? null,
    email: row.email ?? null,
    emailVerified: row.emailVerified ?? null,
    image: row.image ?? null,
    role: row.role ?? 'member',
    dateOfBirth: row.date_of_birth ?? null,
    age: row.age,
    height: row.height,
    weight: row.weight,
    gender: row.gender,
    activityLevel: row.activity_level,
    goal: row.goal,
    goalStrategy: row.goal_strategy ?? null,
    activityFocus: row.activity_focus ?? [],
    dietStyle: row.diet_style || 'balanced',
    units: row.units || 'metric',
    dailyWinsActiveKeys: row.daily_wins_active_keys,
    dailyWinsTemplateKey: row.daily_wins_template_key,
    dailyWinsChallengeStartDate: row.daily_wins_challenge_start_date,
    customMacros: row.custom_protein != null ? {
      protein: row.custom_protein,
      fat: row.custom_fat,
      carbs: row.custom_carbs,
      calories: row.custom_calories,
    } : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
