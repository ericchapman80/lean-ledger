import { sql } from '../db.js';

function formatFavoriteBeverage(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    beverageType: row.beverage_type || 'water',
    amount: row.amount,
    unit: row.unit,
    amountFlOz: row.amount_fl_oz,
    countsTowardHydration: row.counts_toward_hydration ?? true,
    calories: row.calories ?? 0,
    protein: row.protein ?? 0,
    carbs: row.carbs ?? 0,
    fat: row.fat ?? 0,
    caffeineMg: row.caffeine_mg,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function create(data) {
  const rows = await sql`
    INSERT INTO favorite_beverages (
      user_id, name, beverage_type, amount, unit, amount_fl_oz, counts_toward_hydration,
      calories, protein, carbs, fat, caffeine_mg
    )
    VALUES (
      ${data.userId}, ${data.name}, ${data.beverageType}, ${data.amount}, ${data.unit}, ${data.amountFlOz},
      ${data.countsTowardHydration}, ${data.calories}, ${data.protein}, ${data.carbs}, ${data.fat}, ${data.caffeineMg}
    )
    RETURNING *
  `;

  return formatFavoriteBeverage(rows[0]);
}

export async function findExactMatch(data) {
  const rows = await sql`
    SELECT *
    FROM favorite_beverages
    WHERE user_id = ${data.userId}
      AND lower(btrim(name)) = lower(btrim(${data.name}))
      AND beverage_type = ${data.beverageType}
      AND amount = ${data.amount}
      AND unit = ${data.unit}
      AND amount_fl_oz = ${data.amountFlOz}
      AND counts_toward_hydration = ${data.countsTowardHydration}
      AND calories = ${data.calories}
      AND protein = ${data.protein}
      AND carbs = ${data.carbs}
      AND fat = ${data.fat}
      AND caffeine_mg IS NOT DISTINCT FROM ${data.caffeineMg}
    ORDER BY id ASC
    LIMIT 1
  `;

  return rows[0] ? formatFavoriteBeverage(rows[0]) : null;
}

export async function findByUser(userId) {
  const rows = await sql`
    SELECT * FROM favorite_beverages
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;

  return rows.map(formatFavoriteBeverage);
}

export async function remove(id, userId) {
  const rows = await sql`
    DELETE FROM favorite_beverages
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id
  `;

  return rows.length > 0;
}
