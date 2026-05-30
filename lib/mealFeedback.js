import { usesNetCarbs } from './carbUtils.js';

const PROTEIN_ANCHOR_MINIMUM = {
  breakfast: 30,
  lunch: 35,
  dinner: 35,
  snack: 20,
  pre_workout: 25,
  post_workout: 30,
  track_meet: 25,
};

const LIGHT_PROTEIN_MAXIMUM = {
  breakfast: 20,
  lunch: 25,
  dinner: 25,
  snack: 12,
  pre_workout: 15,
  post_workout: 20,
  track_meet: 15,
};

const HIGH_CARB_THRESHOLD = {
  breakfast: 55,
  lunch: 65,
  dinner: 65,
  snack: 35,
  pre_workout: 50,
  post_workout: 60,
  track_meet: 60,
};

const LOW_NET_CARB_THRESHOLD = 15;
const HIGH_NET_CARB_THRESHOLD = 30;
const LARGE_MEAL_CALORIES = {
  breakfast: 700,
  lunch: 850,
  dinner: 850,
  snack: 350,
  pre_workout: 500,
  post_workout: 650,
  track_meet: 700,
};

function getThreshold(map, mealType, fallback) {
  return map[mealType] ?? fallback;
}

export function getMealFeedback(section, dietStyle) {
  if (!section?.totals) return null;

  const mealType = section.mealType || 'breakfast';
  const protein = Number(section.totals.protein || 0);
  const calories = Number(section.totals.calories || 0);
  const carbs = Number(section.totals.carbs || 0);
  const netCarbs = Number(section.totals.netCarbs || 0);
  const feedback = [];
  const carbFocused = usesNetCarbs(dietStyle);

  if (protein >= getThreshold(PROTEIN_ANCHOR_MINIMUM, mealType, 30)) {
    feedback.push({
      tone: 'positive',
      shortLabel: 'Protein anchor',
      message: `${section.label} brings strong protein support.`,
    });
  }

  if (carbFocused) {
    if (netCarbs <= LOW_NET_CARB_THRESHOLD) {
      feedback.push({
        tone: 'positive',
        shortLabel: 'Low net carbs',
        message: `${section.label} stays low in net carbs.`,
      });
    } else if (netCarbs >= HIGH_NET_CARB_THRESHOLD) {
      feedback.push({
        tone: 'neutral',
        shortLabel: 'Net carbs high',
        message: `${section.label} leans higher in net carbs.`,
      });
    }
  } else if (carbs >= getThreshold(HIGH_CARB_THRESHOLD, mealType, 60)) {
    feedback.push({
      tone: 'neutral',
      shortLabel: 'Carb heavy',
      message: `${section.label} leans more carb-heavy than average.`,
    });
  }

  if (protein <= getThreshold(LIGHT_PROTEIN_MAXIMUM, mealType, 20)) {
    feedback.push({
      tone: 'neutral',
      shortLabel: 'Protein light',
      message: `${section.label} is lighter on protein than your usual target.`,
    });
  }

  if (calories >= getThreshold(LARGE_MEAL_CALORIES, mealType, 800)) {
    feedback.push({
      tone: 'neutral',
      shortLabel: 'Big meal',
      message: `${section.label} carries a bigger share of your daily calories.`,
    });
  }

  return feedback[0] || null;
}
