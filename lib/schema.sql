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
  goal            TEXT NOT NULL CHECK (goal IN ('lose', 'maintain', 'gain', 'recomp')),
  diet_style      TEXT DEFAULT 'balanced' CHECK (diet_style IN ('balanced', 'low_carb', 'keto', 'keto_flexible')),
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
  meal_type   TEXT DEFAULT 'breakfast',
  portion_amount DOUBLE PRECISION,
  portion_unit TEXT,
  portion_grams DOUBLE PRECISION,
  protein     DOUBLE PRECISION NOT NULL,
  fat         DOUBLE PRECISION NOT NULL,
  carbs       DOUBLE PRECISION NOT NULL,
  calories    DOUBLE PRECISION NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS favorite_meals (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  meal_type   TEXT NOT NULL,
  protein     DOUBLE PRECISION NOT NULL,
  fat         DOUBLE PRECISION NOT NULL,
  carbs       DOUBLE PRECISION NOT NULL,
  calories    DOUBLE PRECISION NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS favorite_meal_items (
  id              SERIAL PRIMARY KEY,
  favorite_meal_id INTEGER NOT NULL REFERENCES favorite_meals(id) ON DELETE CASCADE,
  food_name       TEXT NOT NULL,
  portion_amount  DOUBLE PRECISION,
  portion_unit    TEXT,
  portion_grams   DOUBLE PRECISION,
  protein         DOUBLE PRECISION NOT NULL,
  fat             DOUBLE PRECISION NOT NULL,
  carbs           DOUBLE PRECISION NOT NULL,
  calories        DOUBLE PRECISION NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weight_logs (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date        TEXT NOT NULL,
  weight      DOUBLE PRECISION NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS water_entries (
  id                           SERIAL PRIMARY KEY,
  user_id                      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount                       DOUBLE PRECISION NOT NULL,
  unit                         TEXT NOT NULL CHECK (unit IN ('fl_oz', 'cup', 'ml', 'l')),
  amount_fl_oz                 DOUBLE PRECISION NOT NULL,
  recorded_at                  TEXT NOT NULL,
  date                         TEXT NOT NULL,
  beverage_type                TEXT NOT NULL DEFAULT 'water',
  counts_toward_hydration      BOOLEAN NOT NULL DEFAULT TRUE,
  calories                     DOUBLE PRECISION NOT NULL DEFAULT 0,
  protein                      DOUBLE PRECISION NOT NULL DEFAULT 0,
  carbs                        DOUBLE PRECISION NOT NULL DEFAULT 0,
  fat                          DOUBLE PRECISION NOT NULL DEFAULT 0,
  caffeine_mg                  DOUBLE PRECISION,
  created_at                   TIMESTAMPTZ DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS health_metrics (
  id                           SERIAL PRIMARY KEY,
  user_id                      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recorded_at                  TEXT NOT NULL,
  date                         TEXT NOT NULL,
  weight                       DOUBLE PRECISION,
  waist_measurement            DOUBLE PRECISION,
  workout_completed            BOOLEAN,
  hydration_ounces             DOUBLE PRECISION,
  energy_level                 INTEGER,
  hunger_level                 INTEGER,
  soreness_level               INTEGER,
  bmi                          DOUBLE PRECISION,
  body_fat_percent             DOUBLE PRECISION,
  skeletal_muscle              DOUBLE PRECISION,
  muscle_mass                  DOUBLE PRECISION,
  protein_percent              DOUBLE PRECISION,
  bmr                          DOUBLE PRECISION,
  fat_free_body_weight         DOUBLE PRECISION,
  subcutaneous_fat_percent     DOUBLE PRECISION,
  visceral_fat                 DOUBLE PRECISION,
  body_water_percent           DOUBLE PRECISION,
  bone_mass                    DOUBLE PRECISION,
  metabolic_age                DOUBLE PRECISION,
  steps                        DOUBLE PRECISION,
  active_calories              DOUBLE PRECISION,
  resting_heart_rate           DOUBLE PRECISION,
  sleep_hours                  DOUBLE PRECISION,
  hrv                          DOUBLE PRECISION,
  progress_photo_note          TEXT,
  progress_photo_count         INTEGER,
  created_at                   TIMESTAMPTZ DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, recorded_at)
);

CREATE INDEX IF NOT EXISTS idx_meals_user_date       ON meals(user_id, date);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON weight_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_water_entries_user_date ON water_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_water_entries_user_recorded_at ON water_entries(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_metrics_user_date ON health_metrics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_health_metrics_user_recorded_at ON health_metrics(user_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_favorite_meals_user_created_at ON favorite_meals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorite_meal_items_template_id ON favorite_meal_items(favorite_meal_id);

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_goal_check;
ALTER TABLE users
  ADD CONSTRAINT users_goal_check
  CHECK (goal IN ('lose', 'maintain', 'gain', 'recomp'));

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS diet_style TEXT DEFAULT 'balanced';

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_diet_style_check;

ALTER TABLE users
  ADD CONSTRAINT users_diet_style_check
  CHECK (diet_style IN ('balanced', 'low_carb', 'keto', 'keto_flexible'));

ALTER TABLE health_metrics
  ADD COLUMN IF NOT EXISTS waist_measurement DOUBLE PRECISION;

ALTER TABLE health_metrics
  ADD COLUMN IF NOT EXISTS workout_completed BOOLEAN;

ALTER TABLE health_metrics
  ADD COLUMN IF NOT EXISTS hydration_ounces DOUBLE PRECISION;

ALTER TABLE health_metrics
  ADD COLUMN IF NOT EXISTS energy_level INTEGER;

ALTER TABLE health_metrics
  ADD COLUMN IF NOT EXISTS hunger_level INTEGER;

ALTER TABLE health_metrics
  ADD COLUMN IF NOT EXISTS soreness_level INTEGER;

ALTER TABLE health_metrics
  ADD COLUMN IF NOT EXISTS progress_photo_note TEXT;

ALTER TABLE health_metrics
  ADD COLUMN IF NOT EXISTS progress_photo_count INTEGER;

ALTER TABLE meals
  ADD COLUMN IF NOT EXISTS meal_type TEXT DEFAULT 'breakfast';

ALTER TABLE meals
  ADD COLUMN IF NOT EXISTS portion_amount DOUBLE PRECISION;

ALTER TABLE meals
  ADD COLUMN IF NOT EXISTS portion_unit TEXT;

ALTER TABLE meals
  ADD COLUMN IF NOT EXISTS portion_grams DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS idx_meals_user_type_date ON meals(user_id, meal_type, date);

ALTER TABLE water_entries
  ADD COLUMN IF NOT EXISTS amount DOUBLE PRECISION;

ALTER TABLE water_entries
  ADD COLUMN IF NOT EXISTS unit TEXT;

ALTER TABLE water_entries
  ADD COLUMN IF NOT EXISTS amount_fl_oz DOUBLE PRECISION;

ALTER TABLE water_entries
  ADD COLUMN IF NOT EXISTS recorded_at TEXT;

ALTER TABLE water_entries
  ADD COLUMN IF NOT EXISTS date TEXT;

ALTER TABLE water_entries
  ADD COLUMN IF NOT EXISTS beverage_type TEXT NOT NULL DEFAULT 'water';

ALTER TABLE water_entries
  ADD COLUMN IF NOT EXISTS counts_toward_hydration BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE water_entries
  ADD COLUMN IF NOT EXISTS calories DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE water_entries
  ADD COLUMN IF NOT EXISTS protein DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE water_entries
  ADD COLUMN IF NOT EXISTS carbs DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE water_entries
  ADD COLUMN IF NOT EXISTS fat DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE water_entries
  ADD COLUMN IF NOT EXISTS caffeine_mg DOUBLE PRECISION;

ALTER TABLE water_entries
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
