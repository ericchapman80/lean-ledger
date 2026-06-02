import { sql } from '../db.js';
import { DEFAULT_DAILY_WIN_KEYS } from '../dailyWins.js';

export async function findById(id) {
  const rows = await sql`SELECT * FROM users WHERE id = ${id}`;
  return rows[0] ? formatUser(rows[0]) : null;
}

export async function createWithId(id, data) {
  const dailyWinsActiveKeys = data.dailyWinsActiveKeys ?? DEFAULT_DAILY_WIN_KEYS;
  const rows = await sql`
    INSERT INTO users (
      id, age, height, weight, gender, activity_level, goal, diet_style, units,
      custom_protein, custom_fat, custom_carbs, custom_calories, daily_wins_active_keys
    ) VALUES (
      ${id},
      ${data.age},
      ${data.height},
      ${data.weight},
      ${data.gender},
      ${data.activityLevel},
      ${data.goal},
      ${data.dietStyle || 'balanced'},
      ${data.units || 'metric'},
      ${data.customMacros?.protein ?? null},
      ${data.customMacros?.fat ?? null},
      ${data.customMacros?.carbs ?? null},
      ${data.customMacros?.calories ?? null},
      ${dailyWinsActiveKeys}
    )
    RETURNING *
  `;
  return formatUser(rows[0]);
}

export async function update(id, data) {
  const dailyWinsActiveKeys = data.dailyWinsActiveKeys ?? DEFAULT_DAILY_WIN_KEYS;
  const rows = await sql`
    UPDATE users SET
      age             = ${data.age},
      height          = ${data.height},
      weight          = ${data.weight},
      gender          = ${data.gender},
      activity_level  = ${data.activityLevel},
      goal            = ${data.goal},
      diet_style      = ${data.dietStyle || 'balanced'},
      units           = ${data.units || 'metric'},
      custom_protein  = ${data.customMacros?.protein ?? null},
      custom_fat      = ${data.customMacros?.fat ?? null},
      custom_carbs    = ${data.customMacros?.carbs ?? null},
      custom_calories = ${data.customMacros?.calories ?? null},
      daily_wins_active_keys = ${dailyWinsActiveKeys},
      updated_at      = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] ? formatUser(rows[0]) : null;
}

function formatUser(row) {
  return {
    id: row.id,
    age: row.age,
    height: row.height,
    weight: row.weight,
    gender: row.gender,
    activityLevel: row.activity_level,
    goal: row.goal,
    dietStyle: row.diet_style || 'balanced',
    units: row.units || 'metric',
    dailyWinsActiveKeys: row.daily_wins_active_keys,
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
