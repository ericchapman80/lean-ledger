CREATE TABLE IF NOT EXISTS habit_definitions (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  habit_id      INTEGER NOT NULL REFERENCES habit_definitions(id) ON DELETE CASCADE,
  date          TEXT NOT NULL,
  value_boolean BOOLEAN,
  completed     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, habit_id, date)
);

CREATE INDEX IF NOT EXISTS idx_habit_definitions_user_sort_order
  ON habit_definitions(user_id, sort_order, created_at);

CREATE INDEX IF NOT EXISTS idx_daily_habit_logs_user_date
  ON daily_habit_logs(user_id, date);

CREATE INDEX IF NOT EXISTS idx_daily_habit_logs_user_habit_date
  ON daily_habit_logs(user_id, habit_id, date);
