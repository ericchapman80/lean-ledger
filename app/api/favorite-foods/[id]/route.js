import { NextResponse } from 'next/server';
import { getActiveProfileId } from '@/lib/activeProfile';
import * as FavoriteFood from '@/lib/models/favoriteFood';

function isMissingFavoriteFoodsTable(error) {
  return error?.code === '42P01'
    && typeof error?.message === 'string'
    && error.message.includes('favorite_foods');
}

export async function DELETE(request, { params }) {
  try {
    const profileId = await getActiveProfileId(request);
    const { id } = await params;
    const deleted = await FavoriteFood.remove(id, profileId);

    if (!deleted) {
      return NextResponse.json({ error: 'Favorite food not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Favorite food deleted successfully' });
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
