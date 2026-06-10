import { sql } from '../db.js';

// V2.2 Family Profiles: habit definitions are per-profile, scoped by profile_id.
// user_id is still written on create (NOT NULL / ownership / cascade).

const MAX_CUSTOM_HABITS = 10;

function formatHabitDefinition(row) {
  return {
    id: row.id,
    userId: row.user_id,
    profileId: row.profile_id,
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

export async function findByProfile(profileId) {
  const rows = await sql`
    SELECT *
    FROM habit_definitions
    WHERE profile_id = ${profileId}
    ORDER BY sort_order ASC, created_at ASC
  `;
  return rows.map(formatHabitDefinition);
}

export async function findById(profileId, id) {
  const rows = await sql`
    SELECT *
    FROM habit_definitions
    WHERE profile_id = ${profileId} AND id = ${id}
    LIMIT 1
  `;
  return rows[0] ? formatHabitDefinition(rows[0]) : null;
}

export async function countCustomByProfile(profileId) {
  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM habit_definitions
    WHERE profile_id = ${profileId} AND category = 'custom'
  `;
  return rows[0]?.count ?? 0;
}

export async function create(profileId, data, userId) {
  const currentCount = await countCustomByProfile(profileId);
  if (currentCount >= MAX_CUSTOM_HABITS) {
    throw new Error('You can add up to 10 custom habits.');
  }

  const nextSortOrderRows = await sql`
    SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort_order
    FROM habit_definitions
    WHERE profile_id = ${profileId}
  `;
  const nextSortOrder = nextSortOrderRows[0]?.next_sort_order ?? 0;

  const rows = await sql`
    INSERT INTO habit_definitions (
      user_id,
      profile_id,
      name,
      category,
      input_type,
      unit,
      is_system_default,
      is_active,
      sort_order
    ) VALUES (
      ${userId},
      ${profileId},
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

export async function update(profileId, id, data) {
  const rows = await sql`
    UPDATE habit_definitions
    SET
      name = COALESCE(${data.name ?? null}, name),
      is_active = COALESCE(${data.isActive ?? null}, is_active),
      sort_order = COALESCE(${data.sortOrder ?? null}, sort_order),
      updated_at = NOW()
    WHERE profile_id = ${profileId} AND id = ${id}
    RETURNING *
  `;

  return rows[0] ? formatHabitDefinition(rows[0]) : null;
}

export async function deleteById(profileId, id) {
  const rows = await sql`
    DELETE FROM habit_definitions
    WHERE profile_id = ${profileId} AND id = ${id}
    RETURNING id
  `;
  return rows.length > 0;
}

export async function reorder(profileId, orderedIds) {
  await Promise.all(
    orderedIds.map((id, index) => sql`
      UPDATE habit_definitions
      SET sort_order = ${index}, updated_at = NOW()
      WHERE profile_id = ${profileId} AND id = ${id}
    `),
  );
}
