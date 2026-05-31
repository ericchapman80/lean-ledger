import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import * as FavoriteBeverage from '@/lib/models/favoriteBeverage';

function isMissingFavoriteBeveragesTable(error) {
  return error?.code === '42P01'
    && typeof error?.message === 'string'
    && error.message.includes('favorite_beverages');
}

function isDuplicateFavoriteBeverageError(error) {
  return error?.code === '23505'
    && error?.constraint === 'idx_favorite_beverages_user_exact_signature';
}

export async function GET(request) {
  try {
    const userId = await getCurrentUserId(request);
    const favoriteBeverages = await FavoriteBeverage.findByUser(userId);
    return NextResponse.json(favoriteBeverages);
  } catch (error) {
    if (isMissingFavoriteBeveragesTable(error)) {
      return NextResponse.json([]);
    }
    throw error;
  }
}

export async function POST(request) {
  let favoriteBeveragePayload = null;

  try {
    const userId = await getCurrentUserId(request);
    const {
      name,
      beverageType = 'water',
      displayName = null,
      amount,
      unit = 'fl_oz',
      amountFlOz,
      countsTowardHydration,
      calories = 0,
      protein = 0,
      carbs = 0,
      fat = 0,
      caffeineMg = null,
    } = await request.json();

    if (!name || amount == null || amountFlOz == null) {
      return NextResponse.json({ error: 'Name, amount, and normalized amount are required' }, { status: 400 });
    }

    favoriteBeveragePayload = {
      userId,
      name,
      beverageType,
      displayName: displayName == null || displayName === '' ? null : String(displayName).trim(),
      amount: Number(amount),
      unit,
      amountFlOz: Number(amountFlOz),
      countsTowardHydration: Boolean(countsTowardHydration),
      calories: Number(calories || 0),
      protein: Number(protein || 0),
      carbs: Number(carbs || 0),
      fat: Number(fat || 0),
      caffeineMg: caffeineMg == null || caffeineMg === '' ? null : Number(caffeineMg),
    };

    const existing = await FavoriteBeverage.findExactMatch(favoriteBeveragePayload);
    if (existing) {
      return NextResponse.json(existing);
    }

    const favoriteBeverage = await FavoriteBeverage.create(favoriteBeveragePayload);

    return NextResponse.json(favoriteBeverage, { status: 201 });
  } catch (error) {
    if (isDuplicateFavoriteBeverageError(error)) {
      const existing = favoriteBeveragePayload
        ? await FavoriteBeverage.findExactMatch(favoriteBeveragePayload)
        : null;
      if (existing) {
        return NextResponse.json(existing);
      }
    }
    if (isMissingFavoriteBeveragesTable(error)) {
      return NextResponse.json(
        { error: 'Favorite beverages are not initialized yet. Run `npm run init-db` to apply the latest schema.' },
        { status: 503 },
      );
    }
    throw error;
  }
}
