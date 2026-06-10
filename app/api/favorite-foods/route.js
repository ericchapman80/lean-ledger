import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { getActiveProfileId } from '@/lib/activeProfile';
import { optionalNumberOrNull } from '@/lib/carbUtils';
import * as FavoriteFood from '@/lib/models/favoriteFood';

function isMissingFavoriteFoodsTable(error) {
  return error?.code === '42P01'
    && typeof error?.message === 'string'
    && error.message.includes('favorite_foods');
}

function isDuplicateFavoriteFoodError(error) {
  return error?.code === '23505'
    && error?.constraint === 'idx_favorite_foods_profile_exact_signature';
}

export async function GET(request) {
  try {
    const profileId = await getActiveProfileId(request);
    const favoriteFoods = await FavoriteFood.findByProfile(profileId);
    return NextResponse.json(favoriteFoods);
  } catch (error) {
    if (isMissingFavoriteFoodsTable(error)) {
      return NextResponse.json([]);
    }
    throw error;
  }
}

export async function POST(request) {
  let favoriteFoodPayload = null;

  try {
    const userId = await getCurrentUserId(request);
    const profileId = await getActiveProfileId(request);
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

    favoriteFoodPayload = {
      userId,
      profileId,
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
    };

    const existing = await FavoriteFood.findExactMatch(favoriteFoodPayload);
    if (existing) {
      return NextResponse.json(existing);
    }

    const favoriteFood = await FavoriteFood.create(favoriteFoodPayload);

    return NextResponse.json(favoriteFood, { status: 201 });
  } catch (error) {
    if (isDuplicateFavoriteFoodError(error)) {
      const existing = favoriteFoodPayload
        ? await FavoriteFood.findExactMatch(favoriteFoodPayload)
        : null;
      if (existing) {
        return NextResponse.json(existing);
      }
    }
    if (isMissingFavoriteFoodsTable(error)) {
      return NextResponse.json(
        { error: 'Favorite foods are not initialized yet. Run `npm run init-db` to apply the latest schema.' },
        { status: 503 },
      );
    }
    throw error;
  }
}
