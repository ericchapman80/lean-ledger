import { sql } from '../db.js';
import { calculateNetCarbs } from '../carbUtils.js';

// V2.2 Family Profiles: meals are scoped by profile_id (the active profile),
// not user_id. user_id is still written for ownership/audit and the cascade
// chain, but reads/updates/deletes are gated on profile_id so a user acting as
// one profile can never touch another profile's rows.

export async function create(data) {
  const rows = await sql`
    INSERT INTO meals (
      user_id, profile_id, date, meal_name, meal_type, portion_amount, portion_unit, portion_grams,
      protein, fat, carbs, fiber, sugar_alcohols, calories
    )
    VALUES (
      ${data.userId}, ${data.profileId}, ${data.date}, ${data.mealName}, ${data.mealType}, ${data.portionAmount},
      ${data.portionUnit}, ${data.portionGrams}, ${data.protein}, ${data.fat}, ${data.carbs},
      ${data.fiber}, ${data.sugarAlcohols}, ${data.calories}
    )
    RETURNING *
  `;
  return formatMeal(rows[0]);
}

export async function findByProfileAndDate(profileId, date) {
  const rows = await sql`
    SELECT * FROM meals
    WHERE profile_id = ${profileId} AND date = ${date}
    ORDER BY created_at DESC
  `;
  return rows.map(formatMeal);
}

export async function findByProfileAndDateRange(profileId, startDate, endDate) {
  const rows = await sql`
    SELECT * FROM meals
    WHERE profile_id = ${profileId} AND date BETWEEN ${startDate} AND ${endDate}
    ORDER BY date DESC, created_at DESC
  `;
  return rows.map(formatMeal);
}

export async function findByIdForProfile(id, profileId) {
  const rows = await sql`
    SELECT * FROM meals WHERE id = ${id} AND profile_id = ${profileId}
  `;
  return rows[0] ? formatMeal(rows[0]) : null;
}

export async function update(id, profileId, data) {
  const rows = await sql`
    UPDATE meals SET
      meal_name = ${data.mealName},
      meal_type = ${data.mealType},
      portion_amount = ${data.portionAmount},
      portion_unit = ${data.portionUnit},
      portion_grams = ${data.portionGrams},
      protein   = ${data.protein},
      fat       = ${data.fat},
      carbs     = ${data.carbs},
      fiber     = ${data.fiber},
      sugar_alcohols = ${data.sugarAlcohols},
      calories  = ${data.calories}
    WHERE id = ${id} AND profile_id = ${profileId}
    RETURNING *
  `;
  return rows[0] ? formatMeal(rows[0]) : null;
}

export async function remove(id, profileId) {
  const rows = await sql`DELETE FROM meals WHERE id = ${id} AND profile_id = ${profileId} RETURNING id`;
  return rows.length > 0;
}

// Deprecated user-scoped reads — still used by the stats/aggregation routes
// until those are migrated to profile scoping in the final Phase 2 pass.
// Do not use for new code; prefer the findByProfile* variants above.
export async function findByUserAndDate(userId, date) {
  const rows = await sql`
    SELECT * FROM meals
    WHERE user_id = ${userId} AND date = ${date}
    ORDER BY created_at DESC
  `;
  return rows.map(formatMeal);
}

export async function findByUserAndDateRange(userId, startDate, endDate) {
  const rows = await sql`
    SELECT * FROM meals
    WHERE user_id = ${userId} AND date BETWEEN ${startDate} AND ${endDate}
    ORDER BY date DESC, created_at DESC
  `;
  return rows.map(formatMeal);
}

function formatMeal(row) {
  return {
    id: row.id,
    userId: row.user_id,
    profileId: row.profile_id,
    date: row.date,
    mealName: row.meal_name,
    mealType: row.meal_type,
    portionAmount: row.portion_amount,
    portionUnit: row.portion_unit,
    portionGrams: row.portion_grams,
    protein: row.protein,
    fat: row.fat,
    carbs: row.carbs,
    fiber: row.fiber,
    sugarAlcohols: row.sugar_alcohols,
    netCarbs: calculateNetCarbs(row.carbs, row.fiber, row.sugar_alcohols),
    calories: row.calories,
    createdAt: row.created_at,
  };
}
