export const MEAL_TYPE_OPTIONS = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snack', label: 'Snack' },
  { key: 'pre_workout', label: 'Pre Workout' },
  { key: 'post_workout', label: 'Post Workout' },
  { key: 'track_meet', label: 'Track Meet' },
];

const MEAL_TYPE_LABELS = Object.fromEntries(MEAL_TYPE_OPTIONS.map((option) => [option.key, option.label]));

function round(value) {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

export function getMealTypeLabel(mealType) {
  return MEAL_TYPE_LABELS[mealType] || 'Meal';
}

export function calculateMealTotals(items) {
  return items.reduce((totals, item) => ({
    calories: round(totals.calories + Number(item.calories || 0)),
    protein: round(totals.protein + Number(item.protein || 0)),
    carbs: round(totals.carbs + Number(item.carbs || 0)),
    fat: round(totals.fat + Number(item.fat || 0)),
  }), {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
}

export function groupMealsByType(meals) {
  const grouped = meals.reduce((acc, meal) => {
    const mealType = meal.mealType || 'breakfast';
    if (!acc[mealType]) {
      acc[mealType] = [];
    }
    acc[mealType].push(meal);
    return acc;
  }, {});

  return MEAL_TYPE_OPTIONS
    .map((option) => {
      const items = (grouped[option.key] || [])
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return {
        mealType: option.key,
        label: option.label,
        items,
        totals: calculateMealTotals(items),
        count: items.length,
        lastLoggedAt: items[0]?.createdAt || null,
      };
    })
    .filter((section) => section.count > 0);
}

export function buildFavoriteTemplatePayload(name, mealType, items) {
  const normalizedItems = items.map((item) => ({
    foodName: item.mealName,
    portionAmount: item.portionAmount ?? null,
    portionUnit: item.portionUnit ?? null,
    portionGrams: item.portionGrams ?? null,
    protein: Number(item.protein),
    fat: Number(item.fat),
    carbs: Number(item.carbs),
    calories: Number(item.calories),
  }));

  return {
    name,
    mealType,
    ...calculateMealTotals(normalizedItems),
    items: normalizedItems,
  };
}

export function buildMealsFromTemplate(template, date) {
  return template.items.map((item) => ({
    date,
    mealType: template.mealType,
    mealName: item.foodName,
    portionAmount: item.portionAmount ?? '',
    portionUnit: item.portionUnit ?? '',
    portionGrams: item.portionGrams ?? '',
    protein: item.protein,
    fat: item.fat,
    carbs: item.carbs,
    calories: item.calories,
  }));
}

export function buildRepeatMeals(items, targetDate) {
  return items.map((item) => ({
    date: targetDate,
    mealType: item.mealType,
    mealName: item.mealName,
    portionAmount: item.portionAmount ?? '',
    portionUnit: item.portionUnit ?? '',
    portionGrams: item.portionGrams ?? '',
    protein: item.protein,
    fat: item.fat,
    carbs: item.carbs,
    calories: item.calories,
  }));
}

export function findMostRecentMealSection(meals) {
  const grouped = groupMealsByType(meals);
  if (grouped.length === 0) return null;

  return grouped
    .slice()
    .sort((a, b) => new Date(b.lastLoggedAt) - new Date(a.lastLoggedAt))[0];
}

export function summarizeMealLog(meals) {
  const grouped = groupMealsByType(meals);

  return {
    mealCount: grouped.length,
    foodEntryCount: meals.length,
    mealTypes: grouped.map((section) => ({
      mealType: section.mealType,
      label: section.label,
      count: section.count,
    })),
  };
}
