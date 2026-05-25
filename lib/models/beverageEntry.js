import { sql } from '../db.js';

function formatBeverageEntry(row) {
  return {
    id: row.id,
    userId: row.user_id,
    amount: row.amount,
    unit: row.unit,
    amountFlOz: row.amount_fl_oz,
    recordedAt: row.recorded_at,
    date: row.date,
    beverageType: row.beverage_type || 'water',
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
    INSERT INTO water_entries (
      user_id, amount, unit, amount_fl_oz, recorded_at, date,
      beverage_type, counts_toward_hydration, calories, protein, carbs, fat, caffeine_mg
    ) VALUES (
      ${data.userId}, ${data.amount}, ${data.unit}, ${data.amountFlOz}, ${data.recordedAt}, ${data.date},
      ${data.beverageType}, ${data.countsTowardHydration}, ${data.calories}, ${data.protein},
      ${data.carbs}, ${data.fat}, ${data.caffeineMg}
    )
    RETURNING *
  `;
  return formatBeverageEntry(rows[0]);
}

export async function findById(id) {
  const rows = await sql`SELECT * FROM water_entries WHERE id = ${id}`;
  return rows[0] ? formatBeverageEntry(rows[0]) : null;
}

export async function findByUser(userId, limit = 50) {
  const rows = await sql`
    SELECT * FROM water_entries
    WHERE user_id = ${userId}
    ORDER BY recorded_at DESC
    LIMIT ${limit}
  `;
  return rows.map(formatBeverageEntry);
}

export async function findByUserAndDate(userId, date) {
  const rows = await sql`
    SELECT * FROM water_entries
    WHERE user_id = ${userId} AND date = ${date}
    ORDER BY recorded_at DESC
  `;
  return rows.map(formatBeverageEntry);
}

export async function findByUserAndDateRange(userId, startDate, endDate) {
  const rows = await sql`
    SELECT * FROM water_entries
    WHERE user_id = ${userId} AND date BETWEEN ${startDate} AND ${endDate}
    ORDER BY recorded_at DESC
  `;
  return rows.map(formatBeverageEntry);
}

export async function update(id, data) {
  const rows = await sql`
    UPDATE water_entries SET
      amount = ${data.amount},
      unit = ${data.unit},
      amount_fl_oz = ${data.amountFlOz},
      recorded_at = ${data.recordedAt},
      date = ${data.date},
      beverage_type = ${data.beverageType},
      counts_toward_hydration = ${data.countsTowardHydration},
      calories = ${data.calories},
      protein = ${data.protein},
      carbs = ${data.carbs},
      fat = ${data.fat},
      caffeine_mg = ${data.caffeineMg}
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] ? formatBeverageEntry(rows[0]) : null;
}

export async function remove(id) {
  const rows = await sql`DELETE FROM water_entries WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}
