-- V2.2 Family Profiles, Phase 2: move per-day/per-timestamp uniqueness from the
-- user to the profile. A parent's user_id is shared across the dependent
-- profiles they manage, so dedup keyed on user_id would collide across profiles
-- (e.g. a parent and child both logging weight on the same date). Re-key the
-- upsert constraints to profile_id so each profile dedups independently.
--
-- Safe for existing data: migration 016 backfilled one profile per user, so
-- (profile_id, date) and (profile_id, recorded_at) are already unique wherever
-- (user_id, date) / (user_id, recorded_at) were.

ALTER TABLE weight_logs DROP CONSTRAINT IF EXISTS weight_logs_user_id_date_key;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'weight_logs_profile_id_date_key') THEN
    ALTER TABLE weight_logs ADD CONSTRAINT weight_logs_profile_id_date_key UNIQUE (profile_id, date);
  END IF;
END $$;

ALTER TABLE health_metrics DROP CONSTRAINT IF EXISTS health_metrics_user_id_recorded_at_key;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'health_metrics_profile_id_recorded_at_key') THEN
    ALTER TABLE health_metrics ADD CONSTRAINT health_metrics_profile_id_recorded_at_key UNIQUE (profile_id, recorded_at);
  END IF;
END $$;
