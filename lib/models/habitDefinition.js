import { sql } from '../db.js';

const MAX_CUSTOM_HABITS = 10;

function formatHabitDefinition(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    category: row.category,
    inputType: row.input_type,
    unit: row.unit,
    isSystemDefault: row.is_system_default,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findByUser(userId) {
  const rows = await sql`
    SELECT *
    FROM habit_definitions
    WHERE user_id = ${userId}
    ORDER BY sort_order ASC, created_at ASC
  `;
  return rows.map(formatHabitDefinition);
}

export async function findById(userId, id) {
  const rows = await sql`
    SELECT *
    FROM habit_definitions
    WHERE user_id = ${userId} AND id = ${id}
    LIMIT 1
  `;
  return rows[0] ? formatHabitDefinition(rows[0]) : null;
}

export async function countCustomByUser(userId) {
  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM habit_definitions
    WHERE user_id = ${userId} AND category = 'custom'
  `;
  return rows[0]?.count ?? 0;
}

export async function create(userId, data) {
  const currentCount = await countCustomByUser(userId);
  if (currentCount >= MAX_CUSTOM_HABITS) {
    throw new Error('You can add up to 10 custom habits.');
  }

  const nextSortOrderRows = await sql`
    SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort_order
    FROM habit_definitions
    WHERE user_id = ${userId}
  `;
  const nextSortOrder = nextSortOrderRows[0]?.next_sort_order ?? 0;

  const rows = await sql`
    INSERT INTO habit_definitions (
      user_id,
      name,
      category,
      input_type,
      unit,
      is_system_default,
      is_active,
      sort_order
    ) VALUES (
      ${userId},
      ${data.name},
      ${data.category || 'custom'},
      ${data.inputType || 'boolean'},
      ${data.unit ?? null},
      false,
      ${data.isActive ?? true},
      ${data.sortOrder ?? nextSortOrder}
    )
    RETURNING *
  `;

  return formatHabitDefinition(rows[0]);
}

export async function update(userId, id, data) {
  const rows = await sql`
    UPDATE habit_definitions
    SET
      name = COALESCE(${data.name}, name),
      is_active = COALESCE(${data.isActive}, is_active),
      sort_order = COALESCE(${data.sortOrder}, sort_order),
      updated_at = NOW()
    WHERE user_id = ${userId} AND id = ${id}
    RETURNING *
  `;

  return rows[0] ? formatHabitDefinition(rows[0]) : null;
}

export async function deleteById(userId, id) {
  const rows = await sql`
    DELETE FROM habit_definitions
    WHERE user_id = ${userId} AND id = ${id}
    RETURNING id
  `;
  return rows.length > 0;
}

export async function reorder(userId, orderedIds) {
  await Promise.all(
    orderedIds.map((id, index) => sql`
      UPDATE habit_definitions
      SET sort_order = ${index}, updated_at = NOW()
      WHERE user_id = ${userId} AND id = ${id}
    `),
  );
}
