ALTER TABLE users
  ALTER COLUMN daily_wins_active_keys SET DEFAULT ARRAY[]::TEXT[];

UPDATE users
SET daily_wins_active_keys = ARRAY[]::TEXT[]
WHERE daily_wins_active_keys = ARRAY[
  'workoutCompleted',
  'readingCompleted',
  'prayerCompleted',
  'sleepHours',
  'energyLevel',
  'sorenessLevel'
]::TEXT[];
