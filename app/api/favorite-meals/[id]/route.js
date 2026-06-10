import { NextResponse } from 'next/server';
import { getActiveProfileId } from '@/lib/activeProfile';
import * as FavoriteMeal from '@/lib/models/favoriteMeal';

function isMissingFavoriteMealsTable(error) {
  return error?.code === '42P01'
    && typeof error?.message === 'string'
    && error.message.includes('favorite_meals');
}

export async function DELETE(request, { params }) {
  try {
    const profileId = await getActiveProfileId(request);
    const { id } = await params;
    const deleted = await FavoriteMeal.remove(id, profileId);

    if (!deleted) {
      return NextResponse.json({ error: 'Favorite meal not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Favorite meal deleted successfully' });
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
