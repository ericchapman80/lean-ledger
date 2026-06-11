import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { getActiveProfileId } from '@/lib/activeProfile';
import * as FavoriteBeverage from '@/lib/models/favoriteBeverage';
import { normalizeCountsTowardHydration } from '@/lib/beverages';

function isMissingFavoriteBeveragesTable(error) {
  return error?.code === '42P01'
    && typeof error?.message === 'string'
    && error.message.includes('favorite_beverages');
}

function isDuplicateFavoriteBeverageError(error) {
  return error?.code === '23505'
    && error?.constraint === 'idx_favorite_beverages_profile_exact_signature';
}

export async function GET(request) {
  try {
    const profileId = await getActiveProfileId(request);
    const favoriteBeverages = await FavoriteBeverage.findByProfile(profileId);
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
    const profileId = await getActiveProfileId(request);
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

    const safeDisplayName = displayName == null || displayName === '' ? null : String(displayName).trim();

    favoriteBeveragePayload = {
      userId,
      profileId,
      name,
      beverageType,
      displayName: safeDisplayName,
      amount: Number(amount),
      unit,
      amountFlOz: Number(amountFlOz),
      countsTowardHydration: normalizeCountsTowardHydration({
        beverageType,
        displayName: safeDisplayName,
        countsTowardHydration,
      }),
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
