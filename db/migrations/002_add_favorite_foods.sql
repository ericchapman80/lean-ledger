CREATE TABLE IF NOT EXISTS favorite_foods (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  default_meal_type TEXT DEFAULT 'breakfast',
  portion_amount  DOUBLE PRECISION,
  portion_unit    TEXT,
  portion_grams   DOUBLE PRECISION,
  protein         DOUBLE PRECISION NOT NULL,
  fat             DOUBLE PRECISION NOT NULL,
  carbs           DOUBLE PRECISION NOT NULL,
  fiber           DOUBLE PRECISION,
  sugar_alcohols  DOUBLE PRECISION,
  calories        DOUBLE PRECISION NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_favorite_foods_user_created_at
  ON favorite_foods(user_id, created_at DESC);

ALTER TABLE favorite_foods
  ADD COLUMN IF NOT EXISTS default_meal_type TEXT DEFAULT 'breakfast';

ALTER TABLE favorite_foods
  ADD COLUMN IF NOT EXISTS fiber DOUBLE PRECISION;

ALTER TABLE favorite_foods
  ADD COLUMN IF NOT EXISTS sugar_alcohols DOUBLE PRECISION;
