import { sql } from '../db.js';

// V2.2 Family Profiles: beverage/water entries (water_entries) are scoped by
// profile_id. user_id is still written (ownership/cascade). Deprecated
// findByUser* reads remain for the stats routes until the final Phase 2 pass.

function formatBeverageEntry(row) {
  return {
    id: row.id,
    userId: row.user_id,
    profileId: row.profile_id,
    amount: row.amount,
    unit: row.unit,
    amountFlOz: row.amount_fl_oz,
    recordedAt: row.recorded_at,
    date: row.date,
    beverageType: row.beverage_type || 'water',
    displayName: row.display_name,
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
      user_id, profile_id, amount, unit, amount_fl_oz, recorded_at, date,
      beverage_type, display_name, counts_toward_hydration, calories, protein, carbs, fat, caffeine_mg
    ) VALUES (
      ${data.userId}, ${data.profileId}, ${data.amount}, ${data.unit}, ${data.amountFlOz}, ${data.recordedAt}, ${data.date},
      ${data.beverageType}, ${data.displayName}, ${data.countsTowardHydration}, ${data.calories}, ${data.protein},
      ${data.carbs}, ${data.fat}, ${data.caffeineMg}
    )
    RETURNING *
  `;
  return formatBeverageEntry(rows[0]);
}

export async function findByIdForProfile(id, profileId) {
  const rows = await sql`SELECT * FROM water_entries WHERE id = ${id} AND profile_id = ${profileId}`;
  return rows[0] ? formatBeverageEntry(rows[0]) : null;
}

export async function findByProfile(profileId, limit = 50) {
  const rows = await sql`
    SELECT * FROM water_entries
    WHERE profile_id = ${profileId}
    ORDER BY recorded_at DESC
    LIMIT ${limit}
  `;
  return rows.map(formatBeverageEntry);
}

export async function findByProfileAndDate(profileId, date) {
  const rows = await sql`
    SELECT * FROM water_entries
    WHERE profile_id = ${profileId} AND date = ${date}
    ORDER BY recorded_at DESC
  `;
  return rows.map(formatBeverageEntry);
}

export async function findByProfileAndDateRange(profileId, startDate, endDate) {
  const rows = await sql`
    SELECT * FROM water_entries
    WHERE profile_id = ${profileId} AND date BETWEEN ${startDate} AND ${endDate}
    ORDER BY recorded_at DESC
  `;
  return rows.map(formatBeverageEntry);
}

export async function update(id, profileId, data) {
  const rows = await sql`
    UPDATE water_entries SET
      amount = ${data.amount},
      unit = ${data.unit},
      amount_fl_oz = ${data.amountFlOz},
      recorded_at = ${data.recordedAt},
      date = ${data.date},
      beverage_type = ${data.beverageType},
      display_name = ${data.displayName},
      counts_toward_hydration = ${data.countsTowardHydration},
      calories = ${data.calories},
      protein = ${data.protein},
      carbs = ${data.carbs},
      fat = ${data.fat},
      caffeine_mg = ${data.caffeineMg}
    WHERE id = ${id} AND profile_id = ${profileId}
    RETURNING *
  `;
  return rows[0] ? formatBeverageEntry(rows[0]) : null;
}

export async function remove(id, profileId) {
  const rows = await sql`DELETE FROM water_entries WHERE id = ${id} AND profile_id = ${profileId} RETURNING id`;
  return rows.length > 0;
}
