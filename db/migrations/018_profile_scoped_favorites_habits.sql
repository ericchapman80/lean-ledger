-- V2.2 Family Profiles, Phase 2 (batch 2): re-key the favorites/habits
-- uniqueness from user to profile, same rationale as migration 017 — a parent's
-- user_id is shared across managed profiles, so dedup must be per profile.
-- Safe for existing data (migration 016 backfilled one profile per user).

-- daily_habit_logs: one log per (profile, habit, day)
ALTER TABLE daily_habit_logs DROP CONSTRAINT IF EXISTS daily_habit_logs_user_id_habit_id_date_key;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_habit_logs_profile_id_habit_id_date_key') THEN
    ALTER TABLE daily_habit_logs ADD CONSTRAINT daily_habit_logs_profile_id_habit_id_date_key UNIQUE (profile_id, habit_id, date);
  END IF;
END $$;

-- favorite_foods: dedup identical favorites per profile (was per user)
DROP INDEX IF EXISTS idx_favorite_foods_user_exact_signature;
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorite_foods_profile_exact_signature
  ON favorite_foods (
    profile_id,
    lower(btrim(name)),
    COALESCE(default_meal_type, ''),
    COALESCE(portion_amount, -1::double precision),
    COALESCE(portion_unit, ''),
    COALESCE(portion_grams, -1::double precision),
    protein, fat, carbs,
    COALESCE(fiber, -1::double precision),
    COALESCE(sugar_alcohols, -1::double precision),
    calories
  );

-- favorite_beverages: dedup identical favorites per profile (was per user)
DROP INDEX IF EXISTS idx_favorite_beverages_user_exact_signature;
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorite_beverages_profile_exact_signature
  ON favorite_beverages (
    profile_id,
    lower(btrim(name)),
    beverage_type, amount, unit, amount_fl_oz, counts_toward_hydration,
    calories, protein, carbs, fat,
    COALESCE(caffeine_mg, -1::double precision)
  );
