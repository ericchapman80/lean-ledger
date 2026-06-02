ALTER TABLE users
  ADD COLUMN IF NOT EXISTS daily_wins_active_keys TEXT[] NOT NULL DEFAULT ARRAY[
    'workoutCompleted',
    'readingCompleted',
    'prayerCompleted',
    'sleepHours',
    'energyLevel',
    'sorenessLevel'
  ]::TEXT[];
