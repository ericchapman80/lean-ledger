import { sql } from '../db.js';

function formatGoal(row) {
  if (!row) return null;
  return {
    id: row.id,
    profileId: row.profile_id,
    name: row.name,
    phaseType: row.phase_type,
    goalWeight: row.goal_weight,
    goalBodyFatPercent: row.goal_body_fat_percent,
    targetBodyFatMin: row.target_body_fat_min,
    targetBodyFatMax: row.target_body_fat_max,
    minimumLeanMass: row.minimum_lean_mass,
    minimumMuscleMass: row.minimum_muscle_mass,
    goalLeanMass: row.goal_lean_mass,
    goalMuscleMass: row.goal_muscle_mass,
    targetDate: row.target_date,
    baselineRecordedAt: row.baseline_recorded_at,
    baselineWeight: row.baseline_weight,
    baselineBodyFatPercent: row.baseline_body_fat_percent,
    baselineFatMass: row.baseline_fat_mass,
    baselineLeanMass: row.baseline_lean_mass,
    baselineMuscleMass: row.baseline_muscle_mass,
    completionRecordedAt: row.completion_recorded_at,
    completionWeight: row.completion_weight,
    completionBodyFatPercent: row.completion_body_fat_percent,
    completionFatMass: row.completion_fat_mass,
    completionLeanMass: row.completion_lean_mass,
    completionMuscleMass: row.completion_muscle_mass,
    revision: row.revision,
    revisedFromGoalId: row.revised_from_goal_id,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findByIdForProfile(id, profileId) {
  const rows = await sql`
    SELECT *
    FROM body_composition_goals
    WHERE id = ${id} AND profile_id = ${profileId}
    LIMIT 1
  `;
  return formatGoal(rows[0]);
}

export async function findActiveByProfile(profileId) {
  const rows = await sql`
    SELECT *
    FROM body_composition_goals
    WHERE profile_id = ${profileId}
      AND completed_at IS NULL
      AND archived_at IS NULL
    ORDER BY started_at DESC, id DESC
    LIMIT 1
  `;
  return formatGoal(rows[0]);
}

export async function listHistoryByProfile(profileId) {
  const rows = await sql`
    SELECT *
    FROM body_composition_goals
    WHERE profile_id = ${profileId}
      AND (completed_at IS NOT NULL OR archived_at IS NOT NULL)
    ORDER BY COALESCE(completed_at, archived_at, started_at) DESC, id DESC
  `;
  return rows.map(formatGoal);
}

export async function create(data) {
  const rows = await sql`
    INSERT INTO body_composition_goals (
      profile_id,
      name,
      phase_type,
      goal_weight,
      goal_body_fat_percent,
      target_body_fat_min,
      target_body_fat_max,
      minimum_lean_mass,
      minimum_muscle_mass,
      goal_lean_mass,
      goal_muscle_mass,
      target_date,
      baseline_recorded_at,
      baseline_weight,
      baseline_body_fat_percent,
      baseline_fat_mass,
      baseline_lean_mass,
      baseline_muscle_mass
    ) VALUES (
      ${data.profileId},
      ${data.name},
      ${data.phaseType},
      ${data.goalWeight},
      ${data.goalBodyFatPercent},
      ${data.targetBodyFatMin},
      ${data.targetBodyFatMax},
      ${data.minimumLeanMass},
      ${data.minimumMuscleMass},
      ${data.goalLeanMass},
      ${data.goalMuscleMass},
      ${data.targetDate},
      ${data.baselineRecordedAt},
      ${data.baselineWeight},
      ${data.baselineBodyFatPercent},
      ${data.baselineFatMass},
      ${data.baselineLeanMass},
      ${data.baselineMuscleMass}
    )
    RETURNING *
  `;
  return formatGoal(rows[0]);
}

export async function update(id, profileId, data) {
  const rows = await sql`
    UPDATE body_composition_goals SET
      name = ${data.name},
      phase_type = ${data.phaseType},
      goal_weight = ${data.goalWeight},
      goal_body_fat_percent = ${data.goalBodyFatPercent},
      target_body_fat_min = ${data.targetBodyFatMin},
      target_body_fat_max = ${data.targetBodyFatMax},
      minimum_lean_mass = ${data.minimumLeanMass},
      minimum_muscle_mass = ${data.minimumMuscleMass},
      goal_lean_mass = ${data.goalLeanMass},
      goal_muscle_mass = ${data.goalMuscleMass},
      target_date = ${data.targetDate},
      updated_at = NOW()
    WHERE id = ${id}
      AND profile_id = ${profileId}
      AND completed_at IS NULL
      AND archived_at IS NULL
    RETURNING *
  `;
  return formatGoal(rows[0]);
}

export async function complete(id, profileId, snapshot) {
  const rows = await sql`
    UPDATE body_composition_goals SET
      completion_recorded_at = ${snapshot.completionRecordedAt},
      completion_weight = ${snapshot.completionWeight},
      completion_body_fat_percent = ${snapshot.completionBodyFatPercent},
      completion_fat_mass = ${snapshot.completionFatMass},
      completion_lean_mass = ${snapshot.completionLeanMass},
      completion_muscle_mass = ${snapshot.completionMuscleMass},
      completed_at = NOW(),
      updated_at = NOW()
    WHERE id = ${id}
      AND profile_id = ${profileId}
      AND completed_at IS NULL
      AND archived_at IS NULL
    RETURNING *
  `;
  return formatGoal(rows[0]);
}

export async function archive(id, profileId) {
  const rows = await sql`
    UPDATE body_composition_goals SET
      archived_at = NOW(),
      updated_at = NOW()
    WHERE id = ${id}
      AND profile_id = ${profileId}
      AND archived_at IS NULL
      AND completed_at IS NULL
    RETURNING *
  `;
  return formatGoal(rows[0]);
}
