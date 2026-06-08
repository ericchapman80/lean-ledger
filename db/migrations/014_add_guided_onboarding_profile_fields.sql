ALTER TABLE users
  ADD COLUMN IF NOT EXISTS date_of_birth TEXT,
  ADD COLUMN IF NOT EXISTS goal_strategy TEXT,
  ADD COLUMN IF NOT EXISTS activity_focus TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE users
SET goal_strategy = CASE goal
  WHEN 'lose' THEN 'fat_loss'
  WHEN 'recomp' THEN 'lean_recomp'
  WHEN 'gain' THEN 'lean_mass_gain'
  ELSE 'maintenance'
END
WHERE goal_strategy IS NULL;
