import { getRecommendedMacros } from './macroCalculator.js';
import { DEFAULT_DAILY_WIN_KEYS, getActiveDailyWinDefinitions, normalizeDailyWinKeys } from './dailyWins.js';
import { findDailyWinTemplate } from './dailyWinTemplates.js';

const MACRO_KEYS = ['protein', 'fat', 'carbs', 'calories'];
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function macrosMatch(activeMacros, recommendedMacros) {
  return MACRO_KEYS.every((key) => activeMacros[key] === recommendedMacros[key]);
}

export function enrichProfile(user) {
  const normalizedDailyWinsActiveKeys = normalizeDailyWinKeys(user.dailyWinsActiveKeys);
  const activeDailyWins = getActiveDailyWinDefinitions(user.dailyWinsActiveKeys);
  const dailyWinsTemplate = user.dailyWinsTemplateKey ? findDailyWinTemplate(user.dailyWinsTemplateKey) : null;

  if (!hasCompletedProfile(user)) {
    return {
      ...user,
      dailyWinsActiveKeys: normalizedDailyWinsActiveKeys,
      activeDailyWins,
      dailyWinsTemplate,
      recommendedMacros: null,
      activeMacros: null,
      hasCustomMacros: !!user.customMacros,
      hasMacroOverrides: false,
      macrosMatchRecommendation: false,
      needsProfile: true,
    };
  }

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
    dailyWinsActiveKeys: normalizedDailyWinsActiveKeys,
    activeDailyWins,
    dailyWinsTemplate,
    recommendedMacros,
    activeMacros,
    hasCustomMacros,
    hasMacroOverrides,
    macrosMatchRecommendation,
  };
}

export function hasCompletedProfile(user) {
  if (!user) return false;

  return (
    user.age != null
    && user.height != null
    && user.weight != null
    && user.gender != null
    && user.activityLevel != null
    && user.goal != null
  );
}

const VALID_GENDERS = ['male', 'female', 'other'];
const VALID_ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
const VALID_GOALS = ['lose', 'maintain', 'gain', 'recomp'];
const VALID_DIET_STYLES = ['balanced', 'low_carb', 'keto', 'keto_flexible'];
const VALID_UNITS = ['metric', 'imperial'];

export function validateProfilePayload(body) {
  const {
    age,
    height,
    weight,
    gender,
    activityLevel,
    goal,
    dietStyle,
    units,
    dailyWinsActiveKeys,
    dailyWinsTemplateKey,
    dailyWinsChallengeStartDate,
  } = body;
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
    const invalidKeys = dailyWinsActiveKeys.some((key) => !DEFAULT_DAILY_WIN_KEYS.includes(key));
    if (invalidKeys) return 'Invalid daily wins configuration';
  }
  if (dailyWinsTemplateKey != null && dailyWinsTemplateKey !== '' && !findDailyWinTemplate(dailyWinsTemplateKey)) {
    return 'Invalid daily wins template';
  }
  if (dailyWinsChallengeStartDate != null && dailyWinsChallengeStartDate !== '' && !DATE_ONLY_PATTERN.test(dailyWinsChallengeStartDate)) {
    return 'Invalid challenge start date';
  }
  return null;
}
