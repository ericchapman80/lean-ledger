import { getRecommendedMacros } from './macroCalculator.js';

export function enrichProfile(user) {
  const recommendedMacros = getRecommendedMacros(
    user.age,
    user.height,
    user.weight,
    user.gender,
    user.activityLevel,
    user.goal,
  );
  const activeMacros = user.customMacros ?? {
    protein: recommendedMacros.protein,
    fat: recommendedMacros.fat,
    carbs: recommendedMacros.carbs,
    calories: recommendedMacros.calories,
  };
  return { ...user, recommendedMacros, activeMacros };
}

const VALID_GENDERS = ['male', 'female', 'other'];
const VALID_ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
const VALID_GOALS = ['lose', 'maintain', 'gain'];
const VALID_UNITS = ['metric', 'imperial'];

export function validateProfilePayload(body) {
  const { age, height, weight, gender, activityLevel, goal, units } = body;
  if (!age || !height || !weight || !gender || !activityLevel || !goal) {
    return 'All fields are required';
  }
  if (!VALID_GENDERS.includes(gender)) return 'Invalid gender';
  if (!VALID_ACTIVITY_LEVELS.includes(activityLevel)) return 'Invalid activity level';
  if (!VALID_GOALS.includes(goal)) return 'Invalid goal';
  if (units && !VALID_UNITS.includes(units)) return 'Invalid units';
  return null;
}
