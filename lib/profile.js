import { getRecommendedMacros } from './macroCalculator.js';
import { DEFAULT_DAILY_WIN_KEYS, getActiveDailyWinDefinitions, normalizeDailyWinKeys } from './dailyWins.js';

const MACRO_KEYS = ['protein', 'fat', 'carbs', 'calories'];

function macrosMatch(activeMacros, recommendedMacros) {
  return MACRO_KEYS.every((key) => activeMacros[key] === recommendedMacros[key]);
}

export function enrichProfile(user) {
  const recommendedMacros = getRecommendedMacros(
    user.age,
    user.height,
    user.weight,
    user.gender,
    user.activityLevel,
    user.goal,
    user.dietStyle,
  );
  const activeMacros = user.customMacros ?? {
    protein: recommendedMacros.protein,
    fat: recommendedMacros.fat,
    carbs: recommendedMacros.carbs,
    calories: recommendedMacros.calories,
  };
  const hasCustomMacros = !!user.customMacros;
  const macrosMatchRecommendation = macrosMatch(activeMacros, recommendedMacros);
  const hasMacroOverrides = hasCustomMacros && !macrosMatchRecommendation;

  return {
    ...user,
    dailyWinsActiveKeys: normalizeDailyWinKeys(user.dailyWinsActiveKeys),
    activeDailyWins: getActiveDailyWinDefinitions(user.dailyWinsActiveKeys),
    recommendedMacros,
    activeMacros,
    hasCustomMacros,
    hasMacroOverrides,
    macrosMatchRecommendation,
  };
}

const VALID_GENDERS = ['male', 'female', 'other'];
const VALID_ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
const VALID_GOALS = ['lose', 'maintain', 'gain', 'recomp'];
const VALID_DIET_STYLES = ['balanced', 'low_carb', 'keto', 'keto_flexible'];
const VALID_UNITS = ['metric', 'imperial'];

export function validateProfilePayload(body) {
  const { age, height, weight, gender, activityLevel, goal, dietStyle, units, dailyWinsActiveKeys } = body;
  if (!age || !height || !weight || !gender || !activityLevel || !goal) {
    return 'All fields are required';
  }
  if (!VALID_GENDERS.includes(gender)) return 'Invalid gender';
  if (!VALID_ACTIVITY_LEVELS.includes(activityLevel)) return 'Invalid activity level';
  if (!VALID_GOALS.includes(goal)) return 'Invalid goal';
  if (dietStyle && !VALID_DIET_STYLES.includes(dietStyle)) return 'Invalid diet style';
  if (units && !VALID_UNITS.includes(units)) return 'Invalid units';
  if (dailyWinsActiveKeys != null) {
    if (!Array.isArray(dailyWinsActiveKeys)) return 'Invalid daily wins configuration';
    const normalizedKeys = normalizeDailyWinKeys(dailyWinsActiveKeys);
    if (normalizedKeys.length === 0 || dailyWinsActiveKeys.length === 0) return 'Select at least one daily win';
    const invalidKeys = dailyWinsActiveKeys.some((key) => !DEFAULT_DAILY_WIN_KEYS.includes(key));
    if (invalidKeys) return 'Invalid daily wins configuration';
  }
  return null;
}
