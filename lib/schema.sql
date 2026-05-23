-- Lean Ledger schema (Postgres / Neon)
-- Run via: node scripts/init-db.mjs
-- Safe to re-run: all CREATE statements are idempotent.

CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  age             INTEGER NOT NULL,
  height          DOUBLE PRECISION NOT NULL,
  weight          DOUBLE PRECISION NOT NULL,
  gender          TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  activity_level  TEXT NOT NULL CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal            TEXT NOT NULL CHECK (goal IN ('lose', 'maintain', 'gain')),
  units           TEXT DEFAULT 'metric' CHECK (units IN ('metric', 'imperial')),
  custom_protein  DOUBLE PRECISION,
  custom_fat      DOUBLE PRECISION,
  custom_carbs    DOUBLE PRECISION,
  custom_calories DOUBLE PRECISION,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meals (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date        TEXT NOT NULL,
  meal_name   TEXT NOT NULL,
  protein     DOUBLE PRECISION NOT NULL,
  fat         DOUBLE PRECISION NOT NULL,
  carbs       DOUBLE PRECISION NOT NULL,
  calories    DOUBLE PRECISION NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weight_logs (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date        TEXT NOT NULL,
  weight      DOUBLE PRECISION NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_meals_user_date       ON meals(user_id, date);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON weight_logs(user_id, date);
