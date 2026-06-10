import { sql } from '../db.js';
import { calculateNetCarbs } from '../carbUtils.js';

// V2.2 Family Profiles: favorite foods are per-profile templates, scoped by
// profile_id. user_id is still written (ownership/cascade).

export async function create(data) {
  const rows = await sql`
    INSERT INTO favorite_foods (
      user_id, profile_id, name, default_meal_type, portion_amount, portion_unit, portion_grams,
      protein, fat, carbs, fiber, sugar_alcohols, calories
    )
    VALUES (
      ${data.userId}, ${data.profileId}, ${data.name}, ${data.defaultMealType}, ${data.portionAmount}, ${data.portionUnit},
      ${data.portionGrams}, ${data.protein}, ${data.fat}, ${data.carbs}, ${data.fiber},
      ${data.sugarAlcohols}, ${data.calories}
    )
    RETURNING *
  `;

  return formatFavoriteFood(rows[0]);
}

export async function findExactMatch(data) {
  const rows = await sql`
    SELECT *
    FROM favorite_foods
    WHERE profile_id = ${data.profileId}
      AND lower(btrim(name)) = lower(btrim(${data.name}))
      AND default_meal_type IS NOT DISTINCT FROM ${data.defaultMealType}
      AND portion_amount IS NOT DISTINCT FROM ${data.portionAmount}
      AND portion_unit IS NOT DISTINCT FROM ${data.portionUnit}
      AND portion_grams IS NOT DISTINCT FROM ${data.portionGrams}
      AND protein = ${data.protein}
      AND fat = ${data.fat}
      AND carbs = ${data.carbs}
      AND fiber IS NOT DISTINCT FROM ${data.fiber}
      AND sugar_alcohols IS NOT DISTINCT FROM ${data.sugarAlcohols}
      AND calories = ${data.calories}
    ORDER BY id ASC
    LIMIT 1
  `;

  return rows[0] ? formatFavoriteFood(rows[0]) : null;
}

export async function findByProfile(profileId) {
  const rows = await sql`
    SELECT * FROM favorite_foods
    WHERE profile_id = ${profileId}
    ORDER BY created_at DESC
  `;

  return rows.map(formatFavoriteFood);
}

export async function remove(id, profileId) {
  const rows = await sql`
    DELETE FROM favorite_foods
    WHERE id = ${id} AND profile_id = ${profileId}
    RETURNING id
  `;

  return rows.length > 0;
}

function formatFavoriteFood(row) {
  return {
    id: row.id,
    userId: row.user_id,
    profileId: row.profile_id,
    name: row.name,
    defaultMealType: row.default_meal_type,
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
    updatedAt: row.updated_at,
  };
}
