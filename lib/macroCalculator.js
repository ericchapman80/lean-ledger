// Mifflin-St Jeor equation. height in cm, weight in kg.
export function calculateBMR(age, height, weight, gender) {
  let bmr;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else if (gender === 'female') {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 78;
  }
  return Math.round(bmr);
}

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,      // little or no exercise
  light: 1.375,        // light exercise 1–3 days/week
  moderate: 1.55,      // moderate exercise 3–5 days/week
  active: 1.725,       // hard exercise 6–7 days/week
  very_active: 1.9,    // very hard exercise + physical job
};

export function calculateTDEE(bmr, activityLevel) {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.2;
  return Math.round(bmr * multiplier);
}

const GOAL_ADJUSTMENTS = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

const ACTIVITY_DEFICIT_FACTORS = {
  sedentary: 0,
  light: 0.005,
  moderate: 0.015,
  active: 0.025,
  very_active: 0.03,
};

const DIET_STYLE_CARB_SETTINGS = {
  balanced: { min: 0.30, max: 0.40, floor: 140, ceiling: 240 },
  low_carb: { min: 0.15, max: 0.25, floor: 75, ceiling: 125 },
  keto: { min: 20, max: 50 },
  keto_flexible: { weekday: { min: 20, max: 50 }, weekend: { min: 100, max: 175 } },
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function roundToNearest(value, step = 5) {
  return Math.round(value / step) * step;
}

function getDynamicRecompDeficit(tdee, weight, activityLevel, goalWeight = null) {
  const weightFactor = clamp((weight - 75) / 50, 0, 1) * 0.02;
  const activityFactor = ACTIVITY_DEFICIT_FACTORS[activityLevel] ?? 0;
  const goalGapFactor = goalWeight && goalWeight < weight
    ? clamp((weight - goalWeight) / weight, 0, 0.03)
    : 0;
  const deficitPercent = clamp(0.10 + weightFactor + activityFactor + goalGapFactor, 0.10, 0.15);
  return clamp(Math.round(tdee * deficitPercent), 300, 500);
}

function estimateProteinTarget(weightKg, goal, activityLevel) {
  const weightLbs = weightKg * 2.20462;
  const activityBump = ['moderate', 'active', 'very_active'].includes(activityLevel) ? 0.05 : 0;
  const goalBase = goal === 'recomp'
    ? 0.85
    : goal === 'lose'
      ? 0.75
      : 0.7;
  const gramsPerLb = goalBase + activityBump;
  return Math.round(weightLbs * gramsPerLb);
}

function getStyleSpecificCarbTarget(targetCalories, dietStyle, activityLevel, date = new Date()) {
  if (dietStyle === 'keto') {
    return 35;
  }

  if (dietStyle === 'keto_flexible') {
    const isWeekend = [0, 6].includes(date.getDay());
    if (!isWeekend) return 35;

    const weekendBase = Math.round(targetCalories * 0.22 / 4);
    const weekendActivityBump = ['active', 'very_active'].includes(activityLevel) ? 25 : 0;
    return clamp(weekendBase + weekendActivityBump, 100, 175);
  }

  const settings = DIET_STYLE_CARB_SETTINGS[dietStyle] ?? DIET_STYLE_CARB_SETTINGS.balanced;
  const midpointRatio = (settings.min + settings.max) / 2;
  const activityAdjustment = ['active', 'very_active'].includes(activityLevel)
    ? 0.025
    : activityLevel === 'moderate'
      ? 0.01
      : 0;
  const ratioTarget = Math.round((targetCalories * (midpointRatio + activityAdjustment)) / 4);
  return clamp(ratioTarget, settings.floor, settings.ceiling);
}

function calculateRecompMacros(targetCalories, weight, activityLevel, dietStyle, options = {}) {
  const protein = clamp(
    estimateProteinTarget(weight, 'recomp', activityLevel),
    Math.round(weight * 2.20462 * 0.78),
    Math.round(weight * 2.20462 * 0.95),
  );
  const carbs = getStyleSpecificCarbTarget(
    targetCalories,
    dietStyle,
    activityLevel,
    options.date ? new Date(options.date) : new Date(),
  );
  const remainingCalories = targetCalories - ((protein * 4) + (carbs * 4));
  const fat = Math.max(Math.round(remainingCalories / 9), 30);

  return {
    protein,
    fat,
    carbs,
    calories: targetCalories,
  };
}

export function calculateTargetCalories(tdee, goal) {
  return Math.round(tdee + (GOAL_ADJUSTMENTS[goal] ?? 0));
}

const MACRO_RATIOS = {
  lose:     { protein: 0.35, fat: 0.25, carbs: 0.40 },
  gain:     { protein: 0.30, fat: 0.25, carbs: 0.45 },
  maintain: { protein: 0.30, fat: 0.30, carbs: 0.40 },
};

// Calories per gram: protein 4, fat 9, carbs 4.
export function calculateMacros(targetCalories, goal) {
  const ratios = MACRO_RATIOS[goal] ?? MACRO_RATIOS.maintain;
  return {
    protein: Math.round((targetCalories * ratios.protein) / 4),
    fat:     Math.round((targetCalories * ratios.fat) / 9),
    carbs:   Math.round((targetCalories * ratios.carbs) / 4),
    calories: targetCalories,
  };
}

export function getRecommendedMacros(age, height, weight, gender, activityLevel, goal, dietStyle = 'balanced', options = {}) {
  const bmr = calculateBMR(age, height, weight, gender);
  const tdee = calculateTDEE(bmr, activityLevel);
  const recompDeficit = goal === 'recomp'
    ? getDynamicRecompDeficit(tdee, weight, activityLevel, options.goalWeight ?? null)
    : null;
  const targetCalories = goal === 'recomp'
    ? tdee - (recompDeficit ?? 400)
    : calculateTargetCalories(tdee, goal);
  const macros = goal === 'recomp'
    ? calculateRecompMacros(targetCalories, weight, activityLevel, dietStyle, options)
    : calculateMacros(targetCalories, goal);

  return {
    bmr,
    tdee,
    deficit: recompDeficit,
    dietStyle,
    ...macros,
  };
}
