const WEIGHT_UNIT_TO_GRAMS = {
  grams: 1,
  ounces: 28.3495,
  pounds: 453.592,
};

const LIQUID_UNIT_TO_ML = {
  milliliters: 1,
  'fluid ounces': 29.5735,
  cups: 236.588,
  tablespoons: 14.7868,
  teaspoons: 4.92892,
};

export const PORTION_UNITS = [
  { key: 'grams', label: 'grams' },
  { key: 'ounces', label: 'ounces' },
  { key: 'pounds', label: 'pounds' },
  { key: 'fluid ounces', label: 'fluid ounces' },
  { key: 'cups', label: 'cups' },
  { key: 'tablespoons', label: 'tablespoons' },
  { key: 'teaspoons', label: 'teaspoons' },
  { key: 'milliliters', label: 'milliliters' },
  { key: 'serving', label: 'serving' },
];

const SINGULAR_UNIT_LABELS = {
  grams: 'gram',
  ounces: 'ounce',
  pounds: 'pound',
  'fluid ounces': 'fluid ounce',
  cups: 'cup',
  tablespoons: 'tablespoon',
  teaspoons: 'teaspoon',
  milliliters: 'milliliter',
  serving: 'serving',
};

function roundToTwo(value) {
  return Number(value.toFixed(2));
}

export function formatPortionAmount(value) {
  if (!Number.isFinite(value)) return '';
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function parsePortionAmount(input) {
  if (typeof input === 'number') {
    return Number.isFinite(input) ? input : NaN;
  }

  const normalized = String(input ?? '').trim();
  if (!normalized) return NaN;

  const mixedMatch = normalized.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const [, whole, numerator, denominator] = mixedMatch;
    if (Number(denominator) === 0) return NaN;
    return Number(whole) + (Number(numerator) / Number(denominator));
  }

  const fractionMatch = normalized.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const [, numerator, denominator] = fractionMatch;
    if (Number(denominator) === 0) return NaN;
    return Number(numerator) / Number(denominator);
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function getTextSignals(product) {
  return [
    product?.name,
    product?.brands,
    product?.servingUnit,
    product?.category,
    product?.dataType,
    ...(Array.isArray(product?.categories) ? product.categories : []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function inferFoodPortionProfile(product = {}) {
  const signals = getTextSignals(product);
  const liquidPattern = /milk|water|juice|drink|beverage|coffee|tea|creamer|soda|broth|smoothie|shake|liquid|soup/;
  const meatPattern = /chicken|beef|steak|turkey|pork|salmon|tuna|shrimp|meat|burger|ground beef|fillet/;
  const producePattern = /apple|banana|broccoli|spinach|lettuce|pepper|vegetable|fruit|produce|potato|avocado/;

  if (signals.includes('creamer')) {
    return {
      kind: 'liquid',
      defaultUnit: 'tablespoons',
      units: ['tablespoons', 'teaspoons', 'fluid ounces', 'cups', 'milliliters', 'grams', 'serving'],
      densityGramsPerMl: 1,
    };
  }

  if (signals.includes('milk')) {
    return {
      kind: 'liquid',
      defaultUnit: 'cups',
      units: ['cups', 'fluid ounces', 'milliliters', 'tablespoons', 'teaspoons', 'grams', 'serving'],
      densityGramsPerMl: 1,
    };
  }

  if (
    ['ml', 'milliliters', 'l', 'liter', 'liters'].includes(String(product?.servingUnit).toLowerCase())
    || liquidPattern.test(signals)
  ) {
    return {
      kind: 'liquid',
      defaultUnit: 'fluid ounces',
      units: ['fluid ounces', 'cups', 'tablespoons', 'teaspoons', 'milliliters', 'grams', 'serving'],
      densityGramsPerMl: 1,
    };
  }

  if (meatPattern.test(signals)) {
    return {
      kind: 'meat',
      defaultUnit: 'ounces',
      units: ['ounces', 'pounds', 'grams', 'serving'],
      densityGramsPerMl: null,
    };
  }

  if (producePattern.test(signals)) {
    return {
      kind: 'produce',
      defaultUnit: 'grams',
      units: ['grams', 'ounces', 'pounds', 'serving'],
      densityGramsPerMl: null,
    };
  }

  if (product?.brands || product?.source === 'Open Food Facts') {
    return {
      kind: 'packaged',
      defaultUnit: 'serving',
      units: ['serving', 'grams', 'ounces', 'pounds'],
      densityGramsPerMl: null,
    };
  }

  return {
    kind: 'general',
    defaultUnit: 'grams',
    units: ['grams', 'ounces', 'pounds', 'serving'],
    densityGramsPerMl: null,
  };
}

function getServingGramsFromText(name = '') {
  const text = name.toLowerCase();
  const patterns = [
    { regex: /(\d+(?:\.\d+)?)\s*oz\b/, factor: WEIGHT_UNIT_TO_GRAMS.ounces },
    { regex: /(\d+(?:\.\d+)?)\s*lb\b/, factor: WEIGHT_UNIT_TO_GRAMS.pounds },
    { regex: /(\d+(?:\.\d+)?)\s*cup\b/, factor: LIQUID_UNIT_TO_ML.cups },
    { regex: /(\d+(?:\.\d+)?)\s*tbsp\b/, factor: LIQUID_UNIT_TO_ML.tablespoons },
    { regex: /(\d+(?:\.\d+)?)\s*tsp\b/, factor: LIQUID_UNIT_TO_ML.teaspoons },
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern.regex);
    if (match) {
      return Number(match[1]) * pattern.factor;
    }
  }

  return null;
}

export function estimateServingGrams(product = {}) {
  const profile = inferFoodPortionProfile(product);
  if (Number.isFinite(product.servingGrams) && product.servingGrams > 0) {
    return product.servingGrams;
  }

  const servingSize = Number(product.servingSize);
  const servingUnit = String(product.servingUnit || '').toLowerCase();

  if (Number.isFinite(servingSize) && servingSize > 0) {
    if (servingUnit === 'g' || servingUnit === 'gram' || servingUnit === 'grams') {
      return servingSize;
    }
    if (servingUnit === 'ml' || servingUnit === 'milliliters') {
      return servingSize * (profile.densityGramsPerMl || 1);
    }
    if (servingUnit === 'oz') {
      return servingSize * WEIGHT_UNIT_TO_GRAMS.ounces;
    }
    if (servingUnit === 'lb') {
      return servingSize * WEIGHT_UNIT_TO_GRAMS.pounds;
    }
  }

  const fromName = getServingGramsFromText(product.name);
  if (fromName) return fromName;

  return profile.kind === 'packaged' ? 100 : 100;
}

export function convertPortionToGrams({ amount, unit, product }) {
  if (!Number.isFinite(amount) || amount <= 0) return NaN;

  if (unit in WEIGHT_UNIT_TO_GRAMS) {
    return amount * WEIGHT_UNIT_TO_GRAMS[unit];
  }

  if (unit in LIQUID_UNIT_TO_ML) {
    const profile = inferFoodPortionProfile(product);
    const density = profile.densityGramsPerMl || 1;
    return amount * LIQUID_UNIT_TO_ML[unit] * density;
  }

  if (unit === 'serving') {
    return amount * estimateServingGrams(product);
  }

  return NaN;
}

export function calculateMacrosForPortion(productData, amount, unit) {
  const normalizedGrams = convertPortionToGrams({ amount, unit, product: productData });
  const multiplier = normalizedGrams / 100;

  return {
    portionGrams: roundToTwo(normalizedGrams),
    protein: roundToTwo(productData.proteinPer100g * multiplier),
    carbs: roundToTwo(productData.carbsPer100g * multiplier),
    fat: roundToTwo(productData.fatPer100g * multiplier),
    calories: Math.round(productData.caloriesPer100g * multiplier),
  };
}

export function buildPortionSummary(amount, unit, grams) {
  const unitLabel = amount === 1
    ? (SINGULAR_UNIT_LABELS[unit] || unit)
    : unit;

  return {
    label: `${formatPortionAmount(amount)} ${unitLabel}`,
    gramsLabel: `${formatPortionAmount(grams)}g`,
    helperText: `${formatPortionAmount(amount)} ${unitLabel} ≈ ${formatPortionAmount(grams)}g`,
  };
}
