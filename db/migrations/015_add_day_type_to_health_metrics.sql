ALTER TABLE health_metrics
  ADD COLUMN IF NOT EXISTS day_type TEXT;
