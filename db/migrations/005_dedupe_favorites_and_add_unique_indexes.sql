WITH duplicate_foods AS (
  SELECT id
  FROM (
    SELECT
      id,
      row_number() OVER (
        PARTITION BY
          user_id,
          lower(btrim(name)),
          coalesce(default_meal_type, ''),
          coalesce(portion_amount, -1),
          coalesce(portion_unit, ''),
          coalesce(portion_grams, -1),
          protein,
          fat,
          carbs,
          coalesce(fiber, -1),
          coalesce(sugar_alcohols, -1),
          calories
        ORDER BY created_at ASC, id ASC
      ) AS duplicate_rank
    FROM favorite_foods
  ) ranked
  WHERE duplicate_rank > 1
)
DELETE FROM favorite_foods
WHERE id IN (SELECT id FROM duplicate_foods);

WITH duplicate_beverages AS (
  SELECT id
  FROM (
    SELECT
      id,
      row_number() OVER (
        PARTITION BY
          user_id,
          lower(btrim(name)),
          beverage_type,
          amount,
          unit,
          amount_fl_oz,
          counts_toward_hydration,
          calories,
          protein,
          carbs,
          fat,
          coalesce(caffeine_mg, -1)
        ORDER BY created_at ASC, id ASC
      ) AS duplicate_rank
    FROM favorite_beverages
  ) ranked
  WHERE duplicate_rank > 1
)
DELETE FROM favorite_beverages
WHERE id IN (SELECT id FROM duplicate_beverages);

CREATE UNIQUE INDEX IF NOT EXISTS idx_favorite_foods_user_exact_signature
  ON favorite_foods(
    user_id,
    lower(btrim(name)),
    coalesce(default_meal_type, ''),
    coalesce(portion_amount, -1),
    coalesce(portion_unit, ''),
    coalesce(portion_grams, -1),
    protein,
    fat,
    carbs,
    coalesce(fiber, -1),
    coalesce(sugar_alcohols, -1),
    calories
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_favorite_beverages_user_exact_signature
  ON favorite_beverages(
    user_id,
    lower(btrim(name)),
    beverage_type,
    amount,
    unit,
    amount_fl_oz,
    counts_toward_hydration,
    calories,
    protein,
    carbs,
    fat,
    coalesce(caffeine_mg, -1)
  );
