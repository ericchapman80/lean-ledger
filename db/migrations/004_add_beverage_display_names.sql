ALTER TABLE water_entries
  ADD COLUMN IF NOT EXISTS display_name TEXT;

ALTER TABLE favorite_beverages
  ADD COLUMN IF NOT EXISTS display_name TEXT;
