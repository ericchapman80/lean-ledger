import { sql } from '../db.js';

// V2.2 Family Profiles: weight logs are scoped by profile_id. user_id is still
// written (ownership/cascade); dedup is per (profile_id, date) — see migration
// 017. Deprecated findByUser* reads remain for the stats routes until the final
// Phase 2 stats pass.

export async function upsert(data) {
  const rows = await sql`
    INSERT INTO weight_logs (user_id, profile_id, date, weight)
    VALUES (${data.userId}, ${data.profileId}, ${data.date}, ${data.weight})
    ON CONFLICT (profile_id, date) DO UPDATE SET weight = EXCLUDED.weight
    RETURNING *
  `;
  return formatWeight(rows[0]);
}

export async function findByProfileAndDate(profileId, date) {
  const rows = await sql`
    SELECT * FROM weight_logs WHERE profile_id = ${profileId} AND date = ${date}
  `;
  return rows[0] ? formatWeight(rows[0]) : null;
}

export async function findByProfile(profileId, limit = 30) {
  const rows = await sql`
    SELECT * FROM weight_logs
    WHERE profile_id = ${profileId}
    ORDER BY date DESC
    LIMIT ${limit}
  `;
  return rows.map(formatWeight);
}

export async function findByProfileAndDateRange(profileId, startDate, endDate) {
  const rows = await sql`
    SELECT * FROM weight_logs
    WHERE profile_id = ${profileId} AND date BETWEEN ${startDate} AND ${endDate}
    ORDER BY date DESC
  `;
  return rows.map(formatWeight);
}

function formatWeight(row) {
  return {
    id: row.id,
    userId: row.user_id,
    profileId: row.profile_id,
    date: row.date,
    weight: row.weight,
    createdAt: row.created_at,
  };
}
