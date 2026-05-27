import { groupMealsByType } from './mealTemplates.js';

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeNumber(value) {
  if (value == null || value === '') return '';
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(2) : '';
}

function getMealItemSignature(item) {
  return [
    normalizeText(item.mealName || item.foodName),
    normalizeNumber(item.portionAmount),
    normalizeText(item.portionUnit),
    normalizeNumber(item.portionGrams),
    normalizeNumber(item.protein),
    normalizeNumber(item.fat),
    normalizeNumber(item.carbs),
    normalizeNumber(item.fiber),
    normalizeNumber(item.sugarAlcohols),
    normalizeNumber(item.calories),
  ].join('|');
}

export function getMealSectionSignature(items) {
  return items
    .map(getMealItemSignature)
    .sort()
    .join('||');
}

function buildHistoricalMealSections(meals, selectedDate) {
  const groupedByDayAndType = meals.reduce((acc, meal) => {
    if (!meal?.date || meal.date === selectedDate) return acc;
    const mealType = meal.mealType || 'breakfast';
    const key = `${meal.date}:${mealType}`;
    if (!acc[key]) {
      acc[key] = {
        date: meal.date,
        mealType,
        items: [],
      };
    }
    acc[key].items.push(meal);
    return acc;
  }, {});

  return Object.values(groupedByDayAndType).map((section) => ({
    ...section,
    signature: getMealSectionSignature(section.items),
  }));
}

function buildFavoriteSignatureSet(favoriteMeals) {
  return new Set(
    favoriteMeals.map((favoriteMeal) => (
      `${favoriteMeal.mealType || 'breakfast'}::${getMealSectionSignature(favoriteMeal.items || [])}`
    )),
  );
}

export function buildFavoriteMealSuggestions({
  meals,
  recentMeals,
  favoriteMeals,
  selectedDate,
  minimumOccurrences = 3,
}) {
  const currentSections = groupMealsByType(meals);
  const historicalSections = buildHistoricalMealSections(recentMeals, selectedDate);
  const favoriteSignatures = buildFavoriteSignatureSet(favoriteMeals);

  return currentSections
    .map((section) => {
      const signature = getMealSectionSignature(section.items);
      const favoriteKey = `${section.mealType}::${signature}`;

      if (favoriteSignatures.has(favoriteKey)) {
        return null;
      }

      const matchingHistoricalSections = historicalSections.filter((historicalSection) => (
        historicalSection.mealType === section.mealType
        && historicalSection.signature === signature
      ));

      const occurrences = matchingHistoricalSections.length + 1;
      if (occurrences < minimumOccurrences) {
        return null;
      }

      return {
        mealType: section.mealType,
        label: section.label,
        signature,
        occurrences,
        historicalMatches: matchingHistoricalSections.length,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.occurrences - a.occurrences);
}
