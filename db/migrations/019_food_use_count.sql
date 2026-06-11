-- migration 019: track external food source and use count on favorite_foods
ALTER TABLE favorite_foods
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS source      TEXT,
  ADD COLUMN IF NOT EXISTS use_count   INTEGER NOT NULL DEFAULT 0;

-- Unique constraint enables ON CONFLICT upsert keyed by profile + external food id
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorite_foods_profile_external_id
  ON favorite_foods (profile_id, external_id)
  WHERE external_id IS NOT NULL;
