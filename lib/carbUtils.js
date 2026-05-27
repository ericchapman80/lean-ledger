function roundToTwo(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toFiniteNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function zeroIfBlank(value) {
  const numeric = toFiniteNumber(value);
  return numeric == null ? 0 : numeric;
}

export function optionalNumberOrNull(value) {
  const numeric = toFiniteNumber(value);
  return numeric == null ? null : numeric;
}

export function calculateNetCarbs(totalCarbs, fiber = 0, sugarAlcohols = 0) {
  return roundToTwo(Math.max(
    zeroIfBlank(totalCarbs) - zeroIfBlank(fiber) - zeroIfBlank(sugarAlcohols),
    0,
  ));
}

export function usesNetCarbs(dietStyle = 'balanced') {
  return ['low_carb', 'keto', 'keto_flexible'].includes(dietStyle);
}

export function getPrimaryCarbLabel(dietStyle = 'balanced') {
  return usesNetCarbs(dietStyle) ? 'Net Carbs' : 'Carbs';
}

export function getCarbBasisKey(dietStyle = 'balanced') {
  return usesNetCarbs(dietStyle) ? 'netCarbs' : 'carbs';
}

export function enrichCarbFields(entry = {}) {
  const carbs = zeroIfBlank(entry.carbs);
  const fiber = optionalNumberOrNull(entry.fiber);
  const sugarAlcohols = optionalNumberOrNull(entry.sugarAlcohols);

  return {
    ...entry,
    carbs,
    fiber,
    sugarAlcohols,
    netCarbs: calculateNetCarbs(carbs, fiber, sugarAlcohols),
  };
}

export function calculateNutritionTotals(items = []) {
  return items.reduce((totals, item) => {
    const enriched = enrichCarbFields(item);

    return {
      calories: roundToTwo(totals.calories + zeroIfBlank(enriched.calories)),
      protein: roundToTwo(totals.protein + zeroIfBlank(enriched.protein)),
      carbs: roundToTwo(totals.carbs + enriched.carbs),
      fiber: roundToTwo(totals.fiber + zeroIfBlank(enriched.fiber)),
      sugarAlcohols: roundToTwo(totals.sugarAlcohols + zeroIfBlank(enriched.sugarAlcohols)),
      netCarbs: roundToTwo(totals.netCarbs + enriched.netCarbs),
      fat: roundToTwo(totals.fat + zeroIfBlank(enriched.fat)),
    };
  }, {
    calories: 0,
    protein: 0,
    carbs: 0,
    fiber: 0,
    sugarAlcohols: 0,
    netCarbs: 0,
    fat: 0,
  });
}

export function getPrimaryCarbValue(entry, dietStyle = 'balanced') {
  const enriched = enrichCarbFields(entry);
  return usesNetCarbs(dietStyle) ? enriched.netCarbs : enriched.carbs;
}

export function buildCarbTrackingSummary({
  dietStyle = 'balanced',
  totals = {},
  targetCarbs = 0,
}) {
  const enrichedTotals = enrichCarbFields(totals);

  return {
    label: getPrimaryCarbLabel(dietStyle),
    basis: getCarbBasisKey(dietStyle),
    current: getPrimaryCarbValue(enrichedTotals, dietStyle),
    target: zeroIfBlank(targetCarbs),
    totalCarbs: enrichedTotals.carbs,
    fiber: zeroIfBlank(enrichedTotals.fiber),
    sugarAlcohols: zeroIfBlank(enrichedTotals.sugarAlcohols),
    netCarbs: enrichedTotals.netCarbs,
  };
}

export function hasDetailedCarbData(entry = {}) {
  const enriched = enrichCarbFields(entry);
  return zeroIfBlank(enriched.fiber) > 0 || zeroIfBlank(enriched.sugarAlcohols) > 0;
}
