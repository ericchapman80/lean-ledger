import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import * as FavoriteBeverage from '@/lib/models/favoriteBeverage';

export async function DELETE(request, { params }) {
  const userId = await getCurrentUserId(request);
  const removed = await FavoriteBeverage.remove(params.id, userId);

  if (!removed) {
    return NextResponse.json({ error: 'Favorite beverage not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
