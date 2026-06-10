import { sql } from '../db.js';
import { calculateNetCarbs } from '../carbUtils.js';

// V2.2 Family Profiles: favorite meals are per-profile templates, scoped by
// profile_id. user_id is still written (ownership/cascade). Child items are
// owned via favorite_meal_id and cascade with the parent.

export async function create(data) {
  const rows = await sql`
    INSERT INTO favorite_meals (user_id, profile_id, name, meal_type, protein, fat, carbs, fiber, sugar_alcohols, calories)
    VALUES (
      ${data.userId}, ${data.profileId}, ${data.name}, ${data.mealType}, ${data.protein}, ${data.fat}, ${data.carbs},
      ${data.fiber}, ${data.sugarAlcohols}, ${data.calories}
    )
    RETURNING *
  `;

  const favoriteMeal = rows[0];
  for (const item of data.items) {
    await sql`
      INSERT INTO favorite_meal_items (
        favorite_meal_id, food_name, portion_amount, portion_unit, portion_grams,
        protein, fat, carbs, fiber, sugar_alcohols, calories
      )
      VALUES (
        ${favoriteMeal.id}, ${item.foodName}, ${item.portionAmount}, ${item.portionUnit}, ${item.portionGrams},
        ${item.protein}, ${item.fat}, ${item.carbs}, ${item.fiber}, ${item.sugarAlcohols}, ${item.calories}
      )
    `;
  }

  return findById(favoriteMeal.id, data.profileId);
}

export async function findById(id, profileId) {
  const meals = await sql`
    SELECT * FROM favorite_meals
    WHERE id = ${id} AND profile_id = ${profileId}
  `;
  const meal = meals[0];
  if (!meal) return null;

  const items = await sql`
    SELECT * FROM favorite_meal_items
    WHERE favorite_meal_id = ${id}
    ORDER BY id ASC
  `;

  return formatFavoriteMeal(meal, items);
}

export async function findByProfile(profileId) {
  const meals = await sql`
    SELECT * FROM favorite_meals
    WHERE profile_id = ${profileId}
    ORDER BY created_at DESC
  `;

  const results = [];
  for (const meal of meals) {
    const items = await sql`
      SELECT * FROM favorite_meal_items
      WHERE favorite_meal_id = ${meal.id}
      ORDER BY id ASC
    `;
    results.push(formatFavoriteMeal(meal, items));
  }

  return results;
}

export async function remove(id, profileId) {
  const rows = await sql`
    DELETE FROM favorite_meals
    WHERE id = ${id} AND profile_id = ${profileId}
    RETURNING id
  `;
  return rows.length > 0;
}

function formatFavoriteMeal(row, items) {
  return {
    id: row.id,
    userId: row.user_id,
    profileId: row.profile_id,
    name: row.name,
    mealType: row.meal_type,
    protein: row.protein,
    fat: row.fat,
    carbs: row.carbs,
    fiber: row.fiber,
    sugarAlcohols: row.sugar_alcohols,
    netCarbs: calculateNetCarbs(row.carbs, row.fiber, row.sugar_alcohols),
    calories: row.calories,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: items.map((item) => ({
      id: item.id,
      foodName: item.food_name,
      portionAmount: item.portion_amount,
      portionUnit: item.portion_unit,
      portionGrams: item.portion_grams,
      protein: item.protein,
      fat: item.fat,
      carbs: item.carbs,
      fiber: item.fiber,
      sugarAlcohols: item.sugar_alcohols,
      netCarbs: calculateNetCarbs(item.carbs, item.fiber, item.sugar_alcohols),
      calories: item.calories,
      createdAt: item.created_at,
    })),
  };
}
