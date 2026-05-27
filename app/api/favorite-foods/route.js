import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { optionalNumberOrNull } from '@/lib/carbUtils';
import * as FavoriteFood from '@/lib/models/favoriteFood';

function isMissingFavoriteFoodsTable(error) {
  return error?.code === '42P01'
    && typeof error?.message === 'string'
    && error.message.includes('favorite_foods');
}

export async function GET(request) {
  try {
    const userId = await getCurrentUserId(request);
    const favoriteFoods = await FavoriteFood.findByUser(userId);
    return NextResponse.json(favoriteFoods);
  } catch (error) {
    if (isMissingFavoriteFoodsTable(error)) {
      return NextResponse.json([]);
    }
    throw error;
  }
}

export async function POST(request) {
  try {
    const userId = await getCurrentUserId(request);
    const {
      name,
      defaultMealType = 'breakfast',
      portionAmount,
      portionUnit,
      portionGrams,
      protein,
      fat,
      carbs,
      fiber,
      sugarAlcohols,
      calories,
    } = await request.json();

    if (!name || protein == null || fat == null || carbs == null || calories == null) {
      return NextResponse.json({ error: 'Name and macro fields are required' }, { status: 400 });
    }

    const favoriteFood = await FavoriteFood.create({
      userId,
      name,
      defaultMealType,
      portionAmount: portionAmount == null || portionAmount === '' ? null : Number(portionAmount),
      portionUnit: portionUnit || null,
      portionGrams: portionGrams == null || portionGrams === '' ? null : Number(portionGrams),
      protein: Number(protein),
      fat: Number(fat),
      carbs: Number(carbs),
      fiber: optionalNumberOrNull(fiber),
      sugarAlcohols: optionalNumberOrNull(sugarAlcohols),
      calories: Number(calories),
    });

    return NextResponse.json(favoriteFood, { status: 201 });
  } catch (error) {
    if (isMissingFavoriteFoodsTable(error)) {
      return NextResponse.json(
        { error: 'Favorite foods are not initialized yet. Run `npm run init-db` to apply the latest schema.' },
        { status: 503 },
      );
    }
    throw error;
  }
}
