UPDATE water_entries
SET counts_toward_hydration = TRUE
WHERE beverage_type IN (
  'water',
  'sparkling_water',
  'electrolyte_drink',
  'black_coffee',
  'unsweet_tea',
  'diet_drink'
)
OR (
  beverage_type = 'other'
  AND lower(coalesce(display_name, '')) ~ '(americano|espresso|coffee|cold brew|tea|iced tea|electrolyte|lmnt|liquid i\.?v\.?|nuun)'
);

UPDATE favorite_beverages
SET counts_toward_hydration = TRUE
WHERE beverage_type IN (
  'water',
  'sparkling_water',
  'electrolyte_drink',
  'black_coffee',
  'unsweet_tea',
  'diet_drink'
)
OR (
  beverage_type = 'other'
  AND lower(coalesce(display_name, '')) ~ '(americano|espresso|coffee|cold brew|tea|iced tea|electrolyte|lmnt|liquid i\.?v\.?|nuun)'
);
