CREATE TABLE IF NOT EXISTS performance_metrics (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL,
  category TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  date TEXT NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  unit TEXT NOT NULL,
  reps INTEGER,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_profile_date
  ON performance_metrics(profile_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_key
  ON performance_metrics(profile_id, metric_key, recorded_at DESC);
