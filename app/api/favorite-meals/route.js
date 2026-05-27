import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { optionalNumberOrNull } from '@/lib/carbUtils';
import * as FavoriteMeal from '@/lib/models/favoriteMeal';

function isMissingFavoriteMealsTable(error) {
  return error?.code === '42P01'
    && typeof error?.message === 'string'
    && error.message.includes('favorite_meals');
}

export async function GET(request) {
  try {
    const userId = await getCurrentUserId(request);
    const favoriteMeals = await FavoriteMeal.findByUser(userId);
    return NextResponse.json(favoriteMeals);
  } catch (error) {
    if (isMissingFavoriteMealsTable(error)) {
      return NextResponse.json([]);
    }
    throw error;
  }
}

export async function POST(request) {
  try {
    const userId = await getCurrentUserId(request);
    const { name, mealType, protein, fat, carbs, fiber, sugarAlcohols, calories, items } = await request.json();

    if (!name || !mealType || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Name, meal type, and items are required' }, { status: 400 });
    }

    const favoriteMeal = await FavoriteMeal.create({
      userId,
      name,
      mealType,
      protein: Number(protein),
      fat: Number(fat),
      carbs: Number(carbs),
      fiber: optionalNumberOrNull(fiber),
      sugarAlcohols: optionalNumberOrNull(sugarAlcohols),
      calories: Number(calories),
      items: items.map((item) => ({
        foodName: item.foodName,
        portionAmount: item.portionAmount == null || item.portionAmount === '' ? null : Number(item.portionAmount),
        portionUnit: item.portionUnit || null,
        portionGrams: item.portionGrams == null || item.portionGrams === '' ? null : Number(item.portionGrams),
        protein: Number(item.protein),
        fat: Number(item.fat),
        carbs: Number(item.carbs),
        fiber: optionalNumberOrNull(item.fiber),
        sugarAlcohols: optionalNumberOrNull(item.sugarAlcohols),
        calories: Number(item.calories),
      })),
    });

    return NextResponse.json(favoriteMeal, { status: 201 });
  } catch (error) {
    if (isMissingFavoriteMealsTable(error)) {
      return NextResponse.json(
        { error: 'Favorite meals are not initialized yet. Run `npm run init-db` to apply the latest schema.' },
        { status: 503 },
      );
    }
    throw error;
  }
}
