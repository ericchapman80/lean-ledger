import { formatDate, getTodayDate } from '@/lib/utils/dateUtils.js';

const FL_OZ_PER_CUP = 8;
const ML_PER_FL_OZ = 29.5735;
const FL_OZ_PER_LITER = 33.814;
const DEFAULT_WATER_OZ_PER_LB = 0.5;
const DEFAULT_WORKOUT_BONUS_FL_OZ = 20;
const LOW_CARB_HYDRATION_BUFFER_FL_OZ = 8;
const KETO_HYDRATION_BUFFER_FL_OZ = 12;
const KETO_FLEXIBLE_WEEKEND_BUFFER_FL_OZ = 6;

export const BEVERAGE_UNITS = [
  { key: 'fl_oz', label: 'Fluid Ounces', shortLabel: 'oz' },
  { key: 'cup', label: 'Cups', shortLabel: 'cups' },
  { key: 'ml', label: 'Milliliters', shortLabel: 'mL' },
  { key: 'l', label: 'Liters', shortLabel: 'L' },
];

export const BEVERAGE_TYPES = [
  { key: 'water', label: 'Water', countsTowardHydration: true, hydrationMultiplier: 1, defaults: { calories: 0, protein: 0, carbs: 0, fat: 0 } },
  { key: 'sparkling_water', label: 'Sparkling Water', countsTowardHydration: true, hydrationMultiplier: 1, defaults: { calories: 0, protein: 0, carbs: 0, fat: 0 } },
  { key: 'electrolyte_drink', label: 'Electrolyte Drink', countsTowardHydration: true, hydrationMultiplier: 1, defaults: { calories: 0, protein: 0, carbs: 0, fat: 0 } },
  { key: 'black_coffee', label: 'Black Coffee', countsTowardHydration: true, hydrationMultiplier: 0.95, defaults: { calories: 0, protein: 0, carbs: 0, fat: 0 } },
  { key: 'unsweet_tea', label: 'Unsweet Tea', countsTowardHydration: true, hydrationMultiplier: 1, defaults: { calories: 0, protein: 0, carbs: 0, fat: 0 } },
  { key: 'keto_coffee', label: 'Keto Coffee', countsTowardHydration: false, hydrationMultiplier: 0.25, defaults: { calories: 0, protein: 0, carbs: 0, fat: 0 } },
  { key: 'protein_shake', label: 'Protein Shake', countsTowardHydration: false, hydrationMultiplier: 0.25, defaults: { calories: 0, protein: 0, carbs: 0, fat: 0 } },
  { key: 'milk', label: 'Milk', countsTowardHydration: false, hydrationMultiplier: 0.5, defaults: { calories: 0, protein: 0, carbs: 0, fat: 0 } },
  { key: 'diet_drink', label: 'Diet Drink', countsTowardHydration: true, hydrationMultiplier: 0.9, defaults: { calories: 0, protein: 0, carbs: 0, fat: 0 } },
  { key: 'other', label: 'Other', countsTowardHydration: false, hydrationMultiplier: 0.5, defaults: { calories: 0, protein: 0, carbs: 0, fat: 0 } },
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

function isWeekendDate(date) {
  if (!date) return false;
  const day = new Date(`${date}T00:00:00`).getDay();
  return day === 0 || day === 6;
}

function getDietStyleHydrationAdjustment(dietStyle, date) {
  switch (dietStyle) {
    case 'low_carb':
      return { label: 'low-carb buffer', amountFlOz: LOW_CARB_HYDRATION_BUFFER_FL_OZ };
    case 'keto':
      return { label: 'keto buffer', amountFlOz: KETO_HYDRATION_BUFFER_FL_OZ };
    case 'keto_flexible':
      return isWeekendDate(date)
        ? { label: 'flexible-weekend buffer', amountFlOz: KETO_FLEXIBLE_WEEKEND_BUFFER_FL_OZ }
        : { label: 'keto-weekday buffer', amountFlOz: KETO_HYDRATION_BUFFER_FL_OZ };
    default:
      return { label: null, amountFlOz: 0 };
  }
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

export function getHydrationMultiplier(beverageType) {
  const meta = getBeverageTypeMeta(beverageType);
  return Number.isFinite(meta.hydrationMultiplier) ? meta.hydrationMultiplier : 0;
}

export function getHydrationContributionFlOz(entry) {
  if (!entry?.countsTowardHydration) return 0;
  const multiplier = getHydrationMultiplier(entry.beverageType);
  return round(Number(entry.amountFlOz || 0) * multiplier, 1);
}

export function getBeverageDisplayName(entry) {
  if (entry?.beverageType === 'other' && entry?.displayName?.trim()) {
    return entry.displayName.trim();
  }
  return getBeverageTypeMeta(entry?.beverageType).label;
}

export function getDefaultBeverageForm(date, units = 'imperial') {
  return {
    beverageType: 'water',
    displayName: '',
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
  const today = getTodayDate();
  if (date === today) {
    return `${date}T${getLocalTimeValue()}`;
  }
  return `${date}T20:00`;
}

export function getDefaultBeverageTime(date) {
  return date === getTodayDate() ? getLocalTimeValue() : '20:00';
}

export function normalizeBeverageEntryInput({
  amount,
  unit = 'fl_oz',
  recordedAt,
  beverageType = 'water',
  displayName = null,
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
  const safeDisplayName = displayName == null ? null : String(displayName).trim();

  if (!Number.isFinite(numericAmount) || numericAmount < 0) {
    throw new Error('Beverage amount must be a non-negative number');
  }

  if (normalizedFlOz < 0 || normalizedFlOz > 128) {
    throw new Error('Single beverage entries must be between 0 and 128 fluid ounces');
  }

  if (!recordedAt) {
    throw new Error('Recorded time is required');
  }

  if (beverageType === 'other' && !safeDisplayName) {
    throw new Error('Custom beverage name is required for Other');
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
    date: formatDate(recordedAt),
    beverageType,
    displayName: beverageType === 'other' ? safeDisplayName : null,
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
  dietStyle = 'balanced',
  date,
} = {}) {
  const dietStyleAdjustment = getDietStyleHydrationAdjustment(dietStyle, date);
  const appliedWorkoutBonus = workoutCompleted ? workoutBonusFlOz : 0;
  const numericWeight = Number(weightKg);
  if (!Number.isFinite(numericWeight) || numericWeight <= 0) {
    const baselineFlOz = 80;
    return {
      baselineFlOz,
      workoutBonusFlOz: appliedWorkoutBonus,
      dietStyleBonusFlOz: dietStyleAdjustment.amountFlOz,
      dietStyleBonusLabel: dietStyleAdjustment.label,
      targetFlOz: baselineFlOz + appliedWorkoutBonus + dietStyleAdjustment.amountFlOz,
    };
  }

  const weightInLbs = numericWeight * 2.20462;
  const baselineFlOz = round(weightInLbs * waterOzPerLb, 0);

  return {
    baselineFlOz,
    workoutBonusFlOz: appliedWorkoutBonus,
    dietStyleBonusFlOz: dietStyleAdjustment.amountFlOz,
    dietStyleBonusLabel: dietStyleAdjustment.label,
    targetFlOz: baselineFlOz + appliedWorkoutBonus + dietStyleAdjustment.amountFlOz,
  };
}

export function getHydrationHelperCopy({ dietStyle, workoutCompleted = false } = {}) {
  const messages = [];
  if (['low_carb', 'keto', 'keto_flexible'].includes(dietStyle)) {
    messages.push('Low-carb plans use a slightly higher hydration target to account for fluid and electrolyte swings.');
  }
  messages.push('Hydration totals weight beverages by type instead of treating every drink as full water.');
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
  dietStyle = 'balanced',
  date,
} = {}) {
  const totalFluidsFlOz = round(entries.reduce((sum, entry) => sum + Number(entry.amountFlOz || 0), 0), 1);
  const hydrationFlOz = round(entries.reduce((sum, entry) => sum + getHydrationContributionFlOz(entry), 0), 1);
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
    dietStyle,
    date,
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
    dietStyleBonusFlOz: target.dietStyleBonusFlOz,
    dietStyleBonusLabel: target.dietStyleBonusLabel,
    remainingFlOz,
    percentage,
    nutritionTotals,
    totalCaffeineMg,
    hydrationDetails: entries.map((entry) => ({
      beverageType: entry.beverageType || 'water',
      amountFlOz: Number(entry.amountFlOz || 0),
      hydrationMultiplier: entry.countsTowardHydration ? getHydrationMultiplier(entry.beverageType) : 0,
      hydrationContributionFlOz: getHydrationContributionFlOz(entry),
      countsTowardHydration: Boolean(entry.countsTowardHydration),
    })),
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
    acc[date].hydrationFlOz = round(acc[date].hydrationFlOz + getHydrationContributionFlOz(entry), 1);
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
