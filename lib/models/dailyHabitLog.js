import { sql } from '../db.js';

function formatDailyHabitLog(row) {
  return {
    id: row.id,
    userId: row.user_id,
    habitId: row.habit_id,
    date: row.date,
    valueBoolean: row.value_boolean,
    completed: row.completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findByUserAndDateRange(userId, startDate, endDate) {
  const rows = await sql`
    SELECT *
    FROM daily_habit_logs
    WHERE user_id = ${userId} AND date BETWEEN ${startDate} AND ${endDate}
    ORDER BY date DESC, habit_id ASC
  `;
  return rows.map(formatDailyHabitLog);
}

export async function upsert(userId, data) {
  const rows = await sql`
    INSERT INTO daily_habit_logs (
      user_id,
      habit_id,
      date,
      value_boolean,
      completed
    ) VALUES (
      ${userId},
      ${data.habitId},
      ${data.date},
      ${data.valueBoolean ?? null},
      ${data.completed}
    )
    ON CONFLICT (user_id, habit_id, date) DO UPDATE SET
      value_boolean = EXCLUDED.value_boolean,
      completed = EXCLUDED.completed,
      updated_at = NOW()
    RETURNING *
  `;
  return formatDailyHabitLog(rows[0]);
}
