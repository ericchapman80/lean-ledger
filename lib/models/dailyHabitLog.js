import { sql } from '../db.js';

// V2.2 Family Profiles: daily habit logs are scoped by profile_id. user_id is
// still written; dedup is per (profile_id, habit_id, date) — see migration 018.
// Deprecated findByUser* read remains for the stats routes until the final pass.

function formatDailyHabitLog(row) {
  return {
    id: row.id,
    userId: row.user_id,
    profileId: row.profile_id,
    habitId: row.habit_id,
    date: row.date,
    valueBoolean: row.value_boolean,
    completed: row.completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findByProfileAndDateRange(profileId, startDate, endDate) {
  const rows = await sql`
    SELECT *
    FROM daily_habit_logs
    WHERE profile_id = ${profileId} AND date BETWEEN ${startDate} AND ${endDate}
    ORDER BY date DESC, habit_id ASC
  `;
  return rows.map(formatDailyHabitLog);
}

export async function upsert(profileId, data, userId) {
  const rows = await sql`
    INSERT INTO daily_habit_logs (
      user_id,
      profile_id,
      habit_id,
      date,
      value_boolean,
      completed
    ) VALUES (
      ${userId},
      ${profileId},
      ${data.habitId},
      ${data.date},
      ${data.valueBoolean ?? null},
      ${data.completed}
    )
    ON CONFLICT (profile_id, habit_id, date) DO UPDATE SET
      value_boolean = EXCLUDED.value_boolean,
      completed = EXCLUDED.completed,
      updated_at = NOW()
    RETURNING *
  `;
  return formatDailyHabitLog(rows[0]);
}
