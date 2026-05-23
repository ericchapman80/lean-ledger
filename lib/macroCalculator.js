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

// 500 cal deficit ≈ 1 lb/week loss; 300 cal surplus targets lean muscle gain.
const GOAL_ADJUSTMENTS = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

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

export function getRecommendedMacros(age, height, weight, gender, activityLevel, goal) {
  const bmr = calculateBMR(age, height, weight, gender);
  const tdee = calculateTDEE(bmr, activityLevel);
  const targetCalories = calculateTargetCalories(tdee, goal);
  return { bmr, tdee, ...calculateMacros(targetCalories, goal) };
}
