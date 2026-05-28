export function buildFavoriteFoodPayload(meal, favoriteName = meal.mealName) {
  return {
    name: favoriteName,
    defaultMealType: meal.mealType || 'breakfast',
    portionAmount: meal.portionAmount ?? null,
    portionUnit: meal.portionUnit ?? null,
    portionGrams: meal.portionGrams ?? null,
    protein: Number(meal.protein),
    fat: Number(meal.fat),
    carbs: Number(meal.carbs),
    fiber: meal.fiber == null || meal.fiber === '' ? null : Number(meal.fiber),
    sugarAlcohols: meal.sugarAlcohols == null || meal.sugarAlcohols === '' ? null : Number(meal.sugarAlcohols),
    calories: Number(meal.calories),
  };
}

export function buildMealFromFavoriteFood(favoriteFood, date, mealType = favoriteFood.defaultMealType || 'breakfast') {
  return {
    date,
    mealType,
    mealName: favoriteFood.name,
    portionAmount: favoriteFood.portionAmount ?? '',
    portionUnit: favoriteFood.portionUnit ?? '',
    portionGrams: favoriteFood.portionGrams ?? '',
    protein: favoriteFood.protein,
    fat: favoriteFood.fat,
    carbs: favoriteFood.carbs,
    fiber: favoriteFood.fiber ?? '',
    sugarAlcohols: favoriteFood.sugarAlcohols ?? '',
    calories: favoriteFood.calories,
  };
}
