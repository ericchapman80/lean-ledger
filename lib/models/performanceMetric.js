import { sql } from '../db.js';

function formatPerformanceMetric(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    profileId: row.profile_id,
    metricKey: row.metric_key,
    category: row.category,
    recordedAt: row.recorded_at,
    date: row.date,
    value: row.value,
    unit: row.unit,
    reps: row.reps,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function create(data) {
  const rows = await sql`
    INSERT INTO performance_metrics (
      user_id,
      profile_id,
      metric_key,
      category,
      recorded_at,
      date,
      value,
      unit,
      reps,
      note
    ) VALUES (
      ${data.userId},
      ${data.profileId},
      ${data.metricKey},
      ${data.category},
      ${data.recordedAt},
      ${data.date},
      ${data.value},
      ${data.unit},
      ${data.reps},
      ${data.note}
    )
    RETURNING *
  `;
  return formatPerformanceMetric(rows[0]);
}

export async function findByProfile(profileId, { startDate = null, endDate = null, limit = 50 } = {}) {
  const rows = (startDate && endDate)
    ? await sql`
      SELECT *
      FROM performance_metrics
      WHERE profile_id = ${profileId}
        AND date BETWEEN ${startDate} AND ${endDate}
      ORDER BY recorded_at DESC, id DESC
      LIMIT ${limit}
    `
    : await sql`
      SELECT *
      FROM performance_metrics
      WHERE profile_id = ${profileId}
      ORDER BY recorded_at DESC, id DESC
      LIMIT ${limit}
    `;
  return rows.map(formatPerformanceMetric);
}

export async function deleteByIdForProfile(id, profileId) {
  const rows = await sql`
    DELETE FROM performance_metrics
    WHERE id = ${id}
      AND profile_id = ${profileId}
    RETURNING *
  `;
  return formatPerformanceMetric(rows[0]);
}
