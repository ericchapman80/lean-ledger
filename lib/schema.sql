-- Lean Ledger schema (Postgres / Neon)
-- Run via: node scripts/init-db.mjs
-- Safe to re-run: all CREATE statements are idempotent.

CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  name            TEXT,
  email           TEXT,
  "emailVerified" TIMESTAMPTZ,
  image           TEXT,
  role            TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  date_of_birth   TEXT,
  age             INTEGER,
  height          DOUBLE PRECISION,
  weight          DOUBLE PRECISION,
  gender          TEXT CHECK (gender IN ('male', 'female', 'other')),
  activity_level  TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal            TEXT CHECK (goal IN ('lose', 'maintain', 'gain', 'recomp')),
  goal_strategy   TEXT,
  activity_focus  TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  diet_style      TEXT DEFAULT 'balanced' CHECK (diet_style IN ('balanced', 'low_carb', 'keto', 'keto_flexible')),
  units           TEXT DEFAULT 'metric' CHECK (units IN ('metric', 'imperial')),
  daily_wins_active_keys TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  daily_wins_template_key TEXT,
  daily_wins_challenge_start_date TEXT,
  custom_protein  DOUBLE PRECISION,
  custom_fat      DOUBLE PRECISION,
  custom_carbs    DOUBLE PRECISION,
  custom_calories DOUBLE PRECISION,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS allowed_emails (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  invited_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS households (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS household_members (
  id SERIAL PRIMARY KEY,
  household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (household_id, user_id)
);

CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  source_user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  managed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  date_of_birth TEXT,
  age INTEGER,
  height DOUBLE PRECISION,
  weight DOUBLE PRECISION,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal TEXT CHECK (goal IN ('lose', 'maintain', 'gain', 'recomp')),
  goal_strategy TEXT,
  activity_focus TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  diet_style TEXT DEFAULT 'balanced' CHECK (diet_style IN ('balanced', 'low_carb', 'keto', 'keto_flexible')),
  units TEXT DEFAULT 'metric' CHECK (units IN ('metric', 'imperial')),
  daily_wins_active_keys TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  daily_wins_template_key TEXT,
  daily_wins_challenge_start_date TEXT,
  custom_protein DOUBLE PRECISION,
  custom_fat DOUBLE PRECISION,
  custom_carbs DOUBLE PRECISION,
  custom_calories DOUBLE PRECISION,
  is_dependent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meals (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id  INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
  date        TEXT NOT NULL,
  meal_name   TEXT NOT NULL,
  meal_type   TEXT DEFAULT 'breakfast',
  portion_amount DOUBLE PRECISION,
  portion_unit TEXT,
  portion_grams DOUBLE PRECISION,
  protein     DOUBLE PRECISION NOT NULL,
  fat         DOUBLE PRECISION NOT NULL,
  carbs       DOUBLE PRECISION NOT NULL,
  fiber       DOUBLE PRECISION,
  sugar_alcohols DOUBLE PRECISION,
  calories    DOUBLE PRECISION NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS favorite_meals (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id  INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  meal_type   TEXT NOT NULL,
  protein     DOUBLE PRECISION NOT NULL,
  fat         DOUBLE PRECISION NOT NULL,
  carbs       DOUBLE PRECISION NOT NULL,
  fiber       DOUBLE PRECISION,
  sugar_alcohols DOUBLE PRECISION,
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
  fiber           DOUBLE PRECISION,
  sugar_alcohols  DOUBLE PRECISION,
  calories        DOUBLE PRECISION NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS favorite_foods (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id      INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_favorite_foods_user_exact_signature
  ON favorite_foods(
    user_id,
    lower(btrim(name)),
    coalesce(default_meal_type, ''),
    coalesce(portion_amount, -1),
    coalesce(portion_unit, ''),
    coalesce(portion_grams, -1),
    protein,
    fat,
    carbs,
    coalesce(fiber, -1),
    coalesce(sugar_alcohols, -1),
    calories
  );

CREATE TABLE IF NOT EXISTS favorite_beverages (
  id                      SERIAL PRIMARY KEY,
  user_id                 INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id              INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
  name                    TEXT NOT NULL,
  beverage_type           TEXT NOT NULL DEFAULT 'water',
  display_name            TEXT,
  amount                  DOUBLE PRECISION NOT NULL,
  unit                    TEXT NOT NULL,
  amount_fl_oz            DOUBLE PRECISION NOT NULL,
  counts_toward_hydration BOOLEAN NOT NULL DEFAULT TRUE,
  calories                DOUBLE PRECISION NOT NULL DEFAULT 0,
  protein                 DOUBLE PRECISION NOT NULL DEFAULT 0,
  carbs                   DOUBLE PRECISION NOT NULL DEFAULT 0,
  fat                     DOUBLE PRECISION NOT NULL DEFAULT 0,
  caffeine_mg             DOUBLE PRECISION,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_favorite_beverages_user_exact_signature
  ON favorite_beverages(
    user_id,
    lower(btrim(name)),
    beverage_type,
    amount,
    unit,
    amount_fl_oz,
    counts_toward_hydration,
    calories,
    protein,
    carbs,
    fat,
    coalesce(caffeine_mg, -1)
  );

CREATE TABLE IF NOT EXISTS weight_logs (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id  INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
  date        TEXT NOT NULL,
  weight      DOUBLE PRECISION NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS water_entries (
  id                           SERIAL PRIMARY KEY,
  user_id                      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id                   INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
  amount                       DOUBLE PRECISION NOT NULL,
  unit                         TEXT NOT NULL CHECK (unit IN ('fl_oz', 'cup', 'ml', 'l')),
  amount_fl_oz                 DOUBLE PRECISION NOT NULL,
  recorded_at                  TEXT NOT NULL,
  date                         TEXT NOT NULL,
  beverage_type                TEXT NOT NULL DEFAULT 'water',
  display_name                 TEXT,
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
  profile_id                   INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
  recorded_at                  TEXT NOT NULL,
  date                         TEXT NOT NULL,
  weight                       DOUBLE PRECISION,
  waist_measurement            DOUBLE PRECISION,
  workout_completed            BOOLEAN,
  day_type                     TEXT,
  reading_completed            BOOLEAN,
  prayer_completed             BOOLEAN,
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

CREATE TABLE IF NOT EXISTS habit_definitions (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id        INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  category          TEXT NOT NULL DEFAULT 'custom',
  input_type        TEXT NOT NULL DEFAULT 'boolean',
  unit              TEXT,
  is_system_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_habit_logs (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id    INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
  habit_id      INTEGER NOT NULL REFERENCES habit_definitions(id) ON DELETE CASCADE,
  date          TEXT NOT NULL,
  value_boolean BOOLEAN,
  completed     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, habit_id, date)
);

CREATE INDEX IF NOT EXISTS idx_meals_user_date       ON meals(user_id, date);
CREATE INDEX IF NOT EXISTS idx_meals_profile_id ON meals(profile_id);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON weight_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_weight_logs_profile_id ON weight_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_water_entries_user_date ON water_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_water_entries_user_recorded_at ON water_entries(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_water_entries_profile_id ON water_entries(profile_id);
CREATE INDEX IF NOT EXISTS idx_households_creator_user_id ON households(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_household_id ON household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_household_id ON profiles(household_id);
CREATE INDEX IF NOT EXISTS idx_profiles_source_user_id ON profiles(source_user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_meals_profile_id ON favorite_meals(profile_id);
CREATE INDEX IF NOT EXISTS idx_favorite_foods_profile_id ON favorite_foods(profile_id);
CREATE INDEX IF NOT EXISTS idx_favorite_beverages_profile_id ON favorite_beverages(profile_id);
CREATE INDEX IF NOT EXISTS idx_health_metrics_profile_id ON health_metrics(profile_id);
CREATE INDEX IF NOT EXISTS idx_habit_definitions_profile_id ON habit_definitions(profile_id);
CREATE INDEX IF NOT EXISTS idx_daily_habit_logs_profile_id ON daily_habit_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_health_metrics_user_date ON health_metrics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_health_metrics_user_recorded_at ON health_metrics(user_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_habit_definitions_user_sort_order ON habit_definitions(user_id, sort_order, created_at);
CREATE INDEX IF NOT EXISTS idx_daily_habit_logs_user_date ON daily_habit_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_habit_logs_user_habit_date ON daily_habit_logs(user_id, habit_id, date);
CREATE INDEX IF NOT EXISTS idx_favorite_meals_user_created_at ON favorite_meals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorite_meal_items_template_id ON favorite_meal_items(favorite_meal_id);
CREATE INDEX IF NOT EXISTS idx_favorite_foods_user_created_at ON favorite_foods(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorite_beverages_user_created_at ON favorite_beverages(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email) WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  id_token TEXT,
  scope TEXT,
  session_state TEXT,
  token_type TEXT,
  UNIQUE (provider, "providerAccountId")
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts("userId");

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL,
  "sessionToken" TEXT NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions("userId");

CREATE TABLE IF NOT EXISTS verification_token (
  identifier TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL,
  PRIMARY KEY (identifier, token)
);

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_goal_check;
ALTER TABLE users
  ADD CONSTRAINT users_goal_check
  CHECK (goal IN ('lose', 'maintain', 'gain', 'recomp'));

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_daily_wins_challenge_start_date_check;
ALTER TABLE users
  ADD CONSTRAINT users_daily_wins_challenge_start_date_check
  CHECK (
    daily_wins_challenge_start_date IS NULL
    OR daily_wins_challenge_start_date ~ '^\d{4}-\d{2}-\d{2}$'
  );

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS diet_style TEXT DEFAULT 'balanced';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS daily_wins_active_keys TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_diet_style_check;

ALTER TABLE users
  ADD CONSTRAINT users_diet_style_check
  CHECK (diet_style IN ('balanced', 'low_carb', 'keto', 'keto_flexible'));

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS image TEXT;

ALTER TABLE users
  ALTER COLUMN age DROP NOT NULL,
  ALTER COLUMN height DROP NOT NULL,
  ALTER COLUMN weight DROP NOT NULL,
  ALTER COLUMN gender DROP NOT NULL,
  ALTER COLUMN activity_level DROP NOT NULL,
  ALTER COLUMN goal DROP NOT NULL;

ALTER TABLE health_metrics
  ADD COLUMN IF NOT EXISTS waist_measurement DOUBLE PRECISION;

ALTER TABLE health_metrics
  ADD COLUMN IF NOT EXISTS workout_completed BOOLEAN;

ALTER TABLE health_metrics
  ADD COLUMN IF NOT EXISTS reading_completed BOOLEAN;

ALTER TABLE health_metrics
  ADD COLUMN IF NOT EXISTS prayer_completed BOOLEAN;

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

ALTER TABLE meals
  ADD COLUMN IF NOT EXISTS fiber DOUBLE PRECISION;

ALTER TABLE meals
  ADD COLUMN IF NOT EXISTS sugar_alcohols DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS idx_meals_user_type_date ON meals(user_id, meal_type, date);

ALTER TABLE favorite_meals
  ADD COLUMN IF NOT EXISTS fiber DOUBLE PRECISION;

ALTER TABLE favorite_meals
  ADD COLUMN IF NOT EXISTS sugar_alcohols DOUBLE PRECISION;

ALTER TABLE favorite_meal_items
  ADD COLUMN IF NOT EXISTS fiber DOUBLE PRECISION;

ALTER TABLE favorite_meal_items
  ADD COLUMN IF NOT EXISTS sugar_alcohols DOUBLE PRECISION;

ALTER TABLE favorite_foods
  ADD COLUMN IF NOT EXISTS default_meal_type TEXT DEFAULT 'breakfast';

ALTER TABLE favorite_foods
  ADD COLUMN IF NOT EXISTS fiber DOUBLE PRECISION;

ALTER TABLE favorite_foods
  ADD COLUMN IF NOT EXISTS sugar_alcohols DOUBLE PRECISION;

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
  ADD COLUMN IF NOT EXISTS display_name TEXT;

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

ALTER TABLE favorite_beverages
  ADD COLUMN IF NOT EXISTS display_name TEXT;
