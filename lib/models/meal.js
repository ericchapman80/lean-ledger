import { sql } from '../db.js';

export async function create(data) {
  const rows = await sql`
    INSERT INTO meals (
      user_id, date, meal_name, meal_type, portion_amount, portion_unit, portion_grams,
      protein, fat, carbs, calories
    )
    VALUES (
      ${data.userId}, ${data.date}, ${data.mealName}, ${data.mealType}, ${data.portionAmount},
      ${data.portionUnit}, ${data.portionGrams}, ${data.protein}, ${data.fat}, ${data.carbs}, ${data.calories}
    )
    RETURNING *
  `;
  return formatMeal(rows[0]);
}

export async function findById(id) {
  const rows = await sql`SELECT * FROM meals WHERE id = ${id}`;
  return rows[0] ? formatMeal(rows[0]) : null;
}

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

export async function update(id, data) {
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
      calories  = ${data.calories}
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] ? formatMeal(rows[0]) : null;
}

export async function remove(id) {
  const rows = await sql`DELETE FROM meals WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}

function formatMeal(row) {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    mealName: row.meal_name,
    mealType: row.meal_type,
    portionAmount: row.portion_amount,
    portionUnit: row.portion_unit,
    portionGrams: row.portion_grams,
    protein: row.protein,
    fat: row.fat,
    carbs: row.carbs,
    calories: row.calories,
    createdAt: row.created_at,
  };
}
