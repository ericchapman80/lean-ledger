BEGIN;

CREATE TABLE IF NOT EXISTS body_composition_goals (
  id SERIAL PRIMARY KEY,
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phase_type TEXT NOT NULL CHECK (phase_type IN ('cut', 'lean_recomp')),
  goal_weight DOUBLE PRECISION,
  goal_body_fat_percent DOUBLE PRECISION,
  target_body_fat_min DOUBLE PRECISION,
  target_body_fat_max DOUBLE PRECISION,
  minimum_lean_mass DOUBLE PRECISION,
  minimum_muscle_mass DOUBLE PRECISION,
  goal_lean_mass DOUBLE PRECISION,
  goal_muscle_mass DOUBLE PRECISION,
  target_date TEXT,
  baseline_recorded_at TEXT NOT NULL,
  baseline_weight DOUBLE PRECISION,
  baseline_body_fat_percent DOUBLE PRECISION,
  baseline_fat_mass DOUBLE PRECISION,
  baseline_lean_mass DOUBLE PRECISION,
  baseline_muscle_mass DOUBLE PRECISION,
  completion_recorded_at TEXT,
  completion_weight DOUBLE PRECISION,
  completion_body_fat_percent DOUBLE PRECISION,
  completion_fat_mass DOUBLE PRECISION,
  completion_lean_mass DOUBLE PRECISION,
  completion_muscle_mass DOUBLE PRECISION,
  revision INTEGER NOT NULL DEFAULT 1,
  revised_from_goal_id INTEGER REFERENCES body_composition_goals(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_body_composition_goals_profile_id
  ON body_composition_goals(profile_id);

CREATE INDEX IF NOT EXISTS idx_body_composition_goals_profile_lifecycle
  ON body_composition_goals(profile_id, completed_at, archived_at, started_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_body_composition_goals_active_profile
  ON body_composition_goals(profile_id)
  WHERE completed_at IS NULL AND archived_at IS NULL;

COMMIT;
