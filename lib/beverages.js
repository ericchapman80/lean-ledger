const FL_OZ_PER_CUP = 8;
const ML_PER_FL_OZ = 29.5735;
const FL_OZ_PER_LITER = 33.814;
const DEFAULT_WATER_OZ_PER_LB = 0.5;
const DEFAULT_WORKOUT_BONUS_FL_OZ = 20;

export const BEVERAGE_UNITS = [
  { key: 'fl_oz', label: 'Fluid Ounces', shortLabel: 'oz' },
  { key: 'cup', label: 'Cups', shortLabel: 'cups' },
  { key: 'ml', label: 'Milliliters', shortLabel: 'mL' },
  { key: 'l', label: 'Liters', shortLabel: 'L' },
];

export const BEVERAGE_TYPES = [
  { key: 'water', label: 'Water', countsTowardHydration: true, defaults: { calories: 0, protein: 0, carbs: 0, fat: 0 } },
  { key: 'sparkling_water', label: 'Sparkling Water', countsTowardHydration: true, defaults: { calories: 0, protein: 0, carbs: 0, fat: 0 } },
  { key: 'electrolyte_drink', label: 'Electrolyte Drink', countsTowardHydration: true, defaults: { calories: 0, protein: 0, carbs: 0, fat: 0 } },
  { key: 'black_coffee', label: 'Black Coffee', countsTowardHydration: true, defaults: { calories: 0, protein: 0, carbs: 0, fat: 0 } },
  { key: 'unsweet_tea', label: 'Unsweet Tea', countsTowardHydration: true, defaults: { calories: 0, protein: 0, carbs: 0, fat: 0 } },
  { key: 'keto_coffee', label: 'Keto Coffee', countsTowardHydration: false, defaults: { calories: 0, protein: 0, carbs: 0, fat: 0 } },
  { key: 'protein_shake', label: 'Protein Shake', countsTowardHydration: false, defaults: { calories: 0, protein: 0, carbs: 0, fat: 0 } },
  { key: 'milk', label: 'Milk', countsTowardHydration: false, defaults: { calories: 0, protein: 0, carbs: 0, fat: 0 } },
  { key: 'diet_drink', label: 'Diet Drink', countsTowardHydration: true, defaults: { calories: 0, protein: 0, carbs: 0, fat: 0 } },
  { key: 'other', label: 'Other', countsTowardHydration: false, defaults: { calories: 0, protein: 0, carbs: 0, fat: 0 } },
];

const FL_OZ_CONVERSION = {
  fl_oz: 1,
  cup: FL_OZ_PER_CUP,
  ml: 1 / ML_PER_FL_OZ,
  l: FL_OZ_PER_LITER,
};

function round(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function getLocalTimeValue() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function zeroIfBlank(value) {
  return value == null || value === '' ? 0 : Number(value);
}

export function getBeverageTypeMeta(beverageType) {
  return BEVERAGE_TYPES.find((entry) => entry.key === beverageType) || BEVERAGE_TYPES[0];
}

export function getBeverageUnitMeta(unit) {
  return BEVERAGE_UNITS.find((entry) => entry.key === unit) || BEVERAGE_UNITS[0];
}

export function getDefaultCountsTowardHydration(beverageType) {
  return getBeverageTypeMeta(beverageType).countsTowardHydration;
}

export function getDefaultBeverageForm(date, units = 'imperial') {
  return {
    beverageType: 'water',
    amount: '',
    unit: units === 'metric' ? 'ml' : 'fl_oz',
    time: getDefaultBeverageTime(date),
    countsTowardHydration: true,
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    caffeineMg: '',
  };
}

export function convertBeverageToFlOz(amount, unit) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return 0;
  return numericAmount * (FL_OZ_CONVERSION[unit] || 1);
}

export function convertFlOzToUnit(amountFlOz, unit) {
  const numericAmount = Number(amountFlOz);
  if (!Number.isFinite(numericAmount)) return 0;
  switch (unit) {
    case 'cup':
      return numericAmount / FL_OZ_PER_CUP;
    case 'ml':
      return numericAmount * ML_PER_FL_OZ;
    case 'l':
      return numericAmount / FL_OZ_PER_LITER;
    case 'fl_oz':
    default:
      return numericAmount;
  }
}

export function getPreferredBeverageUnit(units = 'imperial') {
  return units === 'metric' ? 'l' : 'fl_oz';
}

export function formatBeverageValue(value, unit) {
  const rounded = round(value, unit === 'ml' ? 0 : 1);
  if (unit === 'ml') return String(Math.round(rounded));
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(1);
}

export function formatBeverageAmount(value, unit) {
  const meta = getBeverageUnitMeta(unit);
  return `${formatBeverageValue(value, unit)} ${meta.shortLabel}`;
}

export function formatBeverageFromFlOz(amountFlOz, unit = 'fl_oz') {
  return formatBeverageAmount(convertFlOzToUnit(amountFlOz, unit), unit);
}

export function buildBeverageRecordedAt(date, time = null) {
  if (time) return `${date}T${time}`;
  const today = new Date().toISOString().slice(0, 10);
  if (date === today) {
    return `${date}T${getLocalTimeValue()}`;
  }
  return `${date}T20:00`;
}

export function getDefaultBeverageTime(date) {
  return date === new Date().toISOString().slice(0, 10) ? getLocalTimeValue() : '20:00';
}

export function normalizeBeverageEntryInput({
  amount,
  unit = 'fl_oz',
  recordedAt,
  beverageType = 'water',
  countsTowardHydration,
  calories = 0,
  protein = 0,
  carbs = 0,
  fat = 0,
  caffeineMg = null,
}) {
  const numericAmount = Number(amount);
  const normalizedFlOz = round(convertBeverageToFlOz(numericAmount, unit), 2);
  const safeCalories = zeroIfBlank(calories);
  const safeProtein = zeroIfBlank(protein);
  const safeCarbs = zeroIfBlank(carbs);
  const safeFat = zeroIfBlank(fat);
  const safeCaffeine = caffeineMg == null || caffeineMg === '' ? null : Number(caffeineMg);

  if (!Number.isFinite(numericAmount) || numericAmount < 0) {
    throw new Error('Beverage amount must be a non-negative number');
  }

  if (normalizedFlOz < 0 || normalizedFlOz > 128) {
    throw new Error('Single beverage entries must be between 0 and 128 fluid ounces');
  }

  if (!recordedAt) {
    throw new Error('Recorded time is required');
  }

  for (const [label, value] of [['Calories', safeCalories], ['Protein', safeProtein], ['Carbs', safeCarbs], ['Fat', safeFat]]) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${label} cannot be negative`);
    }
  }

  if (safeCaffeine != null && (!Number.isFinite(safeCaffeine) || safeCaffeine < 0 || safeCaffeine > 1000)) {
    throw new Error('Caffeine must be between 0 and 1000 mg');
  }

  return {
    amount: numericAmount,
    unit,
    amountFlOz: normalizedFlOz,
    recordedAt,
    date: recordedAt.slice(0, 10),
    beverageType,
    countsTowardHydration: countsTowardHydration == null
      ? getDefaultCountsTowardHydration(beverageType)
      : Boolean(countsTowardHydration),
    calories: safeCalories,
    protein: safeProtein,
    carbs: safeCarbs,
    fat: safeFat,
    caffeineMg: safeCaffeine,
  };
}

export function calculateDailyWaterTarget(weightKg, {
  waterOzPerLb = DEFAULT_WATER_OZ_PER_LB,
  workoutCompleted = false,
  workoutBonusFlOz = DEFAULT_WORKOUT_BONUS_FL_OZ,
} = {}) {
  const numericWeight = Number(weightKg);
  if (!Number.isFinite(numericWeight) || numericWeight <= 0) {
    return {
      baselineFlOz: 80,
      workoutBonusFlOz: workoutCompleted ? workoutBonusFlOz : 0,
      targetFlOz: workoutCompleted ? 80 + workoutBonusFlOz : 80,
    };
  }

  const weightInLbs = numericWeight * 2.20462;
  const baselineFlOz = round(weightInLbs * waterOzPerLb, 0);
  const appliedWorkoutBonus = workoutCompleted ? workoutBonusFlOz : 0;

  return {
    baselineFlOz,
    workoutBonusFlOz: appliedWorkoutBonus,
    targetFlOz: baselineFlOz + appliedWorkoutBonus,
  };
}

export function getHydrationHelperCopy({ dietStyle, workoutCompleted = false } = {}) {
  const messages = [];
  if (['keto', 'keto_flexible'].includes(dietStyle)) {
    messages.push('Hydration and electrolytes matter more during low-carb eating.');
  }
  if (workoutCompleted) {
    messages.push('Training days usually need extra fluids to support performance and recovery.');
  }
  return messages;
}

export function summarizeBeverageEntries(entries, {
  preferredUnit = 'fl_oz',
  weightKg,
  workoutCompleted = false,
  waterOzPerLb = DEFAULT_WATER_OZ_PER_LB,
  workoutBonusFlOz = DEFAULT_WORKOUT_BONUS_FL_OZ,
} = {}) {
  const totalFluidsFlOz = round(entries.reduce((sum, entry) => sum + Number(entry.amountFlOz || 0), 0), 1);
  const hydrationFlOz = round(entries.reduce((sum, entry) => (
    entry.countsTowardHydration ? sum + Number(entry.amountFlOz || 0) : sum
  ), 0), 1);
  const nutritionTotals = entries.reduce((acc, entry) => ({
    calories: acc.calories + zeroIfBlank(entry.calories),
    protein: acc.protein + zeroIfBlank(entry.protein),
    carbs: acc.carbs + zeroIfBlank(entry.carbs),
    fat: acc.fat + zeroIfBlank(entry.fat),
  }), {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const totalCaffeineMg = entries.reduce((sum, entry) => sum + zeroIfBlank(entry.caffeineMg), 0);
  const target = calculateDailyWaterTarget(weightKg, {
    waterOzPerLb,
    workoutCompleted,
    workoutBonusFlOz,
  });
  const remainingFlOz = Math.max(round(target.targetFlOz - hydrationFlOz, 1), 0);
  const percentage = target.targetFlOz > 0
    ? Math.round((hydrationFlOz / target.targetFlOz) * 100)
    : 0;

  return {
    totalFluidsFlOz,
    hydrationFlOz,
    targetFlOz: target.targetFlOz,
    baselineFlOz: target.baselineFlOz,
    workoutBonusFlOz: target.workoutBonusFlOz,
    remainingFlOz,
    percentage,
    nutritionTotals,
    totalCaffeineMg,
    display: {
      consumed: formatBeverageFromFlOz(hydrationFlOz, preferredUnit),
      totalFluids: formatBeverageFromFlOz(totalFluidsFlOz, preferredUnit),
      target: formatBeverageFromFlOz(target.targetFlOz, preferredUnit),
      remaining: formatBeverageFromFlOz(remainingFlOz, preferredUnit),
    },
  };
}

export function calculateBeverageNutritionTotals(entries) {
  return entries.reduce((acc, entry) => ({
    calories: round(acc.calories + zeroIfBlank(entry.calories), 1),
    protein: round(acc.protein + zeroIfBlank(entry.protein), 1),
    carbs: round(acc.carbs + zeroIfBlank(entry.carbs), 1),
    fat: round(acc.fat + zeroIfBlank(entry.fat), 1),
  }), {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
}

export function aggregateBeverageEntriesByDate(entries) {
  return entries.reduce((acc, entry) => {
    const date = entry.date || entry.recordedAt?.slice(0, 10);
    if (!date) return acc;
    if (!acc[date]) {
      acc[date] = {
        hydrationFlOz: 0,
        totalFluidsFlOz: 0,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        caffeineMg: 0,
      };
    }
    acc[date].totalFluidsFlOz = round(acc[date].totalFluidsFlOz + Number(entry.amountFlOz || 0), 1);
    if (entry.countsTowardHydration) {
      acc[date].hydrationFlOz = round(acc[date].hydrationFlOz + Number(entry.amountFlOz || 0), 1);
    }
    acc[date].calories = round(acc[date].calories + zeroIfBlank(entry.calories), 1);
    acc[date].protein = round(acc[date].protein + zeroIfBlank(entry.protein), 1);
    acc[date].carbs = round(acc[date].carbs + zeroIfBlank(entry.carbs), 1);
    acc[date].fat = round(acc[date].fat + zeroIfBlank(entry.fat), 1);
    acc[date].caffeineMg = round(acc[date].caffeineMg + zeroIfBlank(entry.caffeineMg), 1);
    return acc;
  }, {});
}

export function getWaterQuickAddOptions(units = 'imperial') {
  const presetsFlOz = [8, 12, 16, 20, 24, 32];
  if (units === 'metric') {
    return presetsFlOz.map((value) => ({
      amount: Math.round(convertFlOzToUnit(value, 'ml') / 10) * 10,
      unit: 'ml',
      label: `+${Math.round(convertFlOzToUnit(value, 'ml') / 10) * 10} mL`,
    }));
  }

  return presetsFlOz.map((value) => ({
    amount: value,
    unit: 'fl_oz',
    label: `+${value} oz`,
  }));
}
