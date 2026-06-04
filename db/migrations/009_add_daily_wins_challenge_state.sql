ALTER TABLE users
  ADD COLUMN IF NOT EXISTS daily_wins_template_key TEXT;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS daily_wins_challenge_start_date TEXT;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_daily_wins_challenge_start_date_check;
ALTER TABLE users
  ADD CONSTRAINT users_daily_wins_challenge_start_date_check
  CHECK (
    daily_wins_challenge_start_date IS NULL
    OR daily_wins_challenge_start_date ~ '^\d{4}-\d{2}-\d{2}$'
  );
