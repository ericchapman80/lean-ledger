import { getRecommendedMacros } from './macroCalculator.js';
import {
  ACTIVITY_FOCUS_OPTIONS,
  GOAL_STRATEGIES,
  calculateAgeFromDateOfBirth,
  deriveAgeGroup,
  deriveCoachingMode,
  mapGoalStrategyToLegacyGoal,
  normalizeActivityFocus,
} from './coachingProfile.js';
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
  const dateOfBirth = user.dateOfBirth ?? null;
  const derivedAge = dateOfBirth ? calculateAgeFromDateOfBirth(dateOfBirth) : user.age;
  const goalStrategy = user.goalStrategy ?? mapLegacyGoalToGoalStrategy(user.goal);
  const activityFocus = normalizeActivityFocus(user.activityFocus);
  const ageGroup = deriveAgeGroup({ dateOfBirth, age: derivedAge });
  const coachingMode = deriveCoachingMode({ ageGroup, goalStrategy, activityFocus });

  if (!hasCompletedProfile(user)) {
    return {
      ...user,
      dateOfBirth,
      age: derivedAge,
      ageGroup,
      goalStrategy,
      activityFocus,
      coachingMode,
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
    derivedAge,
    user.height,
    user.weight,
    user.gender,
    user.activityLevel,
    mapGoalStrategyToLegacyGoal(goalStrategy),
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
    dateOfBirth,
    age: derivedAge,
    ageGroup,
    goalStrategy,
    activityFocus,
    coachingMode,
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

  const age = user.dateOfBirth ? calculateAgeFromDateOfBirth(user.dateOfBirth) : user.age;

  return (
    age != null
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

function mapLegacyGoalToGoalStrategy(goal = 'maintain') {
  const mapping = {
    lose: 'fat_loss',
    recomp: 'lean_recomp',
    maintain: 'maintenance',
    gain: 'lean_mass_gain',
  };
  return mapping[goal] || 'maintenance';
}

export function validateProfilePayload(body) {
  const {
    dateOfBirth,
    age,
    height,
    weight,
    gender,
    activityLevel,
    goal,
    goalStrategy,
    activityFocus,
    dietStyle,
    units,
    dailyWinsActiveKeys,
    dailyWinsTemplateKey,
    dailyWinsChallengeStartDate,
  } = body;
  const derivedAge = dateOfBirth ? calculateAgeFromDateOfBirth(dateOfBirth) : age;
  if (!dateOfBirth || !derivedAge || !height || !weight || !gender || !activityLevel || !(goalStrategy || goal)) {
    return 'All fields are required';
  }
  if (!DATE_ONLY_PATTERN.test(dateOfBirth)) return 'Invalid date of birth';
  if (!VALID_GENDERS.includes(gender)) return 'Invalid gender';
  if (!VALID_ACTIVITY_LEVELS.includes(activityLevel)) return 'Invalid activity level';
  if (goal && !VALID_GOALS.includes(goal)) return 'Invalid goal';
  if (goalStrategy && !GOAL_STRATEGIES.includes(goalStrategy)) return 'Invalid goal strategy';
  if (activityFocus != null) {
    if (!Array.isArray(activityFocus)) return 'Invalid activity focus';
    const invalidActivityFocus = activityFocus.some((focus) => !ACTIVITY_FOCUS_OPTIONS.includes(focus));
    if (invalidActivityFocus) return 'Invalid activity focus';
  }
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
