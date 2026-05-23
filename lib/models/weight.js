import { sql } from '../db.js';

export async function upsert(data) {
  const rows = await sql`
    INSERT INTO weight_logs (user_id, date, weight)
    VALUES (${data.userId}, ${data.date}, ${data.weight})
    ON CONFLICT (user_id, date) DO UPDATE SET weight = EXCLUDED.weight
    RETURNING *
  `;
  return formatWeight(rows[0]);
}

export async function findByUserAndDate(userId, date) {
  const rows = await sql`
    SELECT * FROM weight_logs WHERE user_id = ${userId} AND date = ${date}
  `;
  return rows[0] ? formatWeight(rows[0]) : null;
}

export async function findByUser(userId, limit = 30) {
  const rows = await sql`
    SELECT * FROM weight_logs
    WHERE user_id = ${userId}
    ORDER BY date DESC
    LIMIT ${limit}
  `;
  return rows.map(formatWeight);
}

export async function findByUserAndDateRange(userId, startDate, endDate) {
  const rows = await sql`
    SELECT * FROM weight_logs
    WHERE user_id = ${userId} AND date BETWEEN ${startDate} AND ${endDate}
    ORDER BY date DESC
  `;
  return rows.map(formatWeight);
}

function formatWeight(row) {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    weight: row.weight,
    createdAt: row.created_at,
  };
}
