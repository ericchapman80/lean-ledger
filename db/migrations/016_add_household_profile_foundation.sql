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

ALTER TABLE meals ADD COLUMN IF NOT EXISTS profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE favorite_meals ADD COLUMN IF NOT EXISTS profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE favorite_foods ADD COLUMN IF NOT EXISTS profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE favorite_beverages ADD COLUMN IF NOT EXISTS profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE weight_logs ADD COLUMN IF NOT EXISTS profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE water_entries ADD COLUMN IF NOT EXISTS profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE health_metrics ADD COLUMN IF NOT EXISTS profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE habit_definitions ADD COLUMN IF NOT EXISTS profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE daily_habit_logs ADD COLUMN IF NOT EXISTS profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE;

INSERT INTO households (name, created_by_user_id)
SELECT
  CASE
    WHEN NULLIF(BTRIM(name), '') IS NOT NULL THEN BTRIM(name) || '''s Household'
    WHEN NULLIF(split_part(COALESCE(email, ''), '@', 1), '') IS NOT NULL THEN split_part(email, '@', 1) || '''s Household'
    ELSE 'Household ' || id::TEXT
  END,
  id
FROM users
WHERE NOT EXISTS (
  SELECT 1
  FROM households h
  WHERE h.created_by_user_id = users.id
);

INSERT INTO household_members (household_id, user_id, role)
SELECT
  h.id,
  u.id,
  'owner'
FROM users u
JOIN households h ON h.created_by_user_id = u.id
ON CONFLICT (household_id, user_id) DO UPDATE
SET role = 'owner';

INSERT INTO profiles (
  household_id,
  source_user_id,
  managed_by_user_id,
  name,
  date_of_birth,
  age,
  height,
  weight,
  gender,
  activity_level,
  goal,
  goal_strategy,
  activity_focus,
  diet_style,
  units,
  daily_wins_active_keys,
  daily_wins_template_key,
  daily_wins_challenge_start_date,
  custom_protein,
  custom_fat,
  custom_carbs,
  custom_calories,
  is_dependent
)
SELECT
  h.id,
  u.id,
  u.id,
  CASE
    WHEN NULLIF(BTRIM(u.name), '') IS NOT NULL THEN BTRIM(u.name)
    WHEN NULLIF(split_part(COALESCE(u.email, ''), '@', 1), '') IS NOT NULL THEN split_part(u.email, '@', 1)
    ELSE 'Profile ' || u.id::TEXT
  END,
  u.date_of_birth,
  u.age,
  u.height,
  u.weight,
  u.gender,
  u.activity_level,
  u.goal,
  u.goal_strategy,
  COALESCE(u.activity_focus, ARRAY[]::TEXT[]),
  COALESCE(u.diet_style, 'balanced'),
  COALESCE(u.units, 'metric'),
  COALESCE(u.daily_wins_active_keys, ARRAY[]::TEXT[]),
  u.daily_wins_template_key,
  u.daily_wins_challenge_start_date,
  u.custom_protein,
  u.custom_fat,
  u.custom_carbs,
  u.custom_calories,
  FALSE
FROM users u
JOIN households h ON h.created_by_user_id = u.id
ON CONFLICT (source_user_id) DO NOTHING;

UPDATE meals m
SET profile_id = p.id
FROM profiles p
WHERE m.profile_id IS NULL
  AND p.source_user_id = m.user_id;

UPDATE favorite_meals fm
SET profile_id = p.id
FROM profiles p
WHERE fm.profile_id IS NULL
  AND p.source_user_id = fm.user_id;

UPDATE favorite_foods ff
SET profile_id = p.id
FROM profiles p
WHERE ff.profile_id IS NULL
  AND p.source_user_id = ff.user_id;

UPDATE favorite_beverages fb
SET profile_id = p.id
FROM profiles p
WHERE fb.profile_id IS NULL
  AND p.source_user_id = fb.user_id;

UPDATE weight_logs wl
SET profile_id = p.id
FROM profiles p
WHERE wl.profile_id IS NULL
  AND p.source_user_id = wl.user_id;

UPDATE water_entries we
SET profile_id = p.id
FROM profiles p
WHERE we.profile_id IS NULL
  AND p.source_user_id = we.user_id;

UPDATE health_metrics hm
SET profile_id = p.id
FROM profiles p
WHERE hm.profile_id IS NULL
  AND p.source_user_id = hm.user_id;

UPDATE habit_definitions hd
SET profile_id = p.id
FROM profiles p
WHERE hd.profile_id IS NULL
  AND p.source_user_id = hd.user_id;

UPDATE daily_habit_logs dhl
SET profile_id = p.id
FROM profiles p
WHERE dhl.profile_id IS NULL
  AND p.source_user_id = dhl.user_id;

CREATE INDEX IF NOT EXISTS idx_households_creator_user_id ON households(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_household_id ON household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_household_id ON profiles(household_id);
CREATE INDEX IF NOT EXISTS idx_profiles_source_user_id ON profiles(source_user_id);
CREATE INDEX IF NOT EXISTS idx_meals_profile_id ON meals(profile_id);
CREATE INDEX IF NOT EXISTS idx_favorite_meals_profile_id ON favorite_meals(profile_id);
CREATE INDEX IF NOT EXISTS idx_favorite_foods_profile_id ON favorite_foods(profile_id);
CREATE INDEX IF NOT EXISTS idx_favorite_beverages_profile_id ON favorite_beverages(profile_id);
CREATE INDEX IF NOT EXISTS idx_weight_logs_profile_id ON weight_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_water_entries_profile_id ON water_entries(profile_id);
CREATE INDEX IF NOT EXISTS idx_health_metrics_profile_id ON health_metrics(profile_id);
CREATE INDEX IF NOT EXISTS idx_habit_definitions_profile_id ON habit_definitions(profile_id);
CREATE INDEX IF NOT EXISTS idx_daily_habit_logs_profile_id ON daily_habit_logs(profile_id);
