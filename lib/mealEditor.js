function roundToTwo(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toNumber(value) {
  if (value == null || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function createMealMacroSnapshot(meal) {
  return {
    portionAmount: toNumber(meal.portionAmount),
    portionUnit: meal.portionUnit || '',
    portionGrams: toNumber(meal.portionGrams),
    protein: Number(meal.protein || 0),
    carbs: Number(meal.carbs || 0),
    fat: Number(meal.fat || 0),
    calories: Number(meal.calories || 0),
  };
}

export function getCalculatedMealMacros(formData, snapshot) {
  if (!snapshot) {
    return {
      protein: formData.protein,
      carbs: formData.carbs,
      fat: formData.fat,
      calories: formData.calories,
    };
  }

  const currentGrams = toNumber(formData.portionGrams);
  const currentAmount = toNumber(formData.portionAmount);
  const originalGrams = snapshot.portionGrams;
  const originalAmount = snapshot.portionAmount;
  const originalUnit = snapshot.portionUnit || '';
  const currentUnit = formData.portionUnit || '';

  let ratio = 1;
  if (currentGrams != null && originalGrams != null && originalGrams > 0) {
    ratio = currentGrams / originalGrams;
  } else if (
    currentAmount != null
    && originalAmount != null
    && originalAmount > 0
    && currentUnit === originalUnit
  ) {
    ratio = currentAmount / originalAmount;
  }

  return {
    protein: String(roundToTwo(snapshot.protein * ratio)),
    carbs: String(roundToTwo(snapshot.carbs * ratio)),
    fat: String(roundToTwo(snapshot.fat * ratio)),
    calories: String(roundToTwo(snapshot.calories * ratio)),
  };
}

export function applyPortionDrivenMacroUpdate(formData, snapshot, manualMacroOverride) {
  if (manualMacroOverride) return formData;
  return {
    ...formData,
    ...getCalculatedMealMacros(formData, snapshot),
  };
}
