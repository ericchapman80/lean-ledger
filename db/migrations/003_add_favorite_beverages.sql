CREATE TABLE IF NOT EXISTS favorite_beverages (
  id                      SERIAL PRIMARY KEY,
  user_id                 INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                    TEXT NOT NULL,
  beverage_type           TEXT NOT NULL DEFAULT 'water',
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

CREATE INDEX IF NOT EXISTS idx_favorite_beverages_user_created_at
  ON favorite_beverages(user_id, created_at DESC);
