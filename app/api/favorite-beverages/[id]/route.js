import { NextResponse } from 'next/server';
import { getActiveProfileId } from '@/lib/activeProfile';
import * as FavoriteBeverage from '@/lib/models/favoriteBeverage';

export async function DELETE(request, { params }) {
  const profileId = await getActiveProfileId(request);
  const { id } = await params;
  const removed = await FavoriteBeverage.remove(id, profileId);

  if (!removed) {
    return NextResponse.json({ error: 'Favorite beverage not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
