ALTER TABLE health_metrics
  ADD COLUMN IF NOT EXISTS reading_completed BOOLEAN;

ALTER TABLE health_metrics
  ADD COLUMN IF NOT EXISTS prayer_completed BOOLEAN;
