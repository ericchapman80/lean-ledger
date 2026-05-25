import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import * as BeverageEntry from '@/lib/models/beverageEntry';
import { normalizeBeverageEntryInput } from '@/lib/beverages';

export async function GET(request) {
  const userId = await getCurrentUserId(request);
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const limit = Number(searchParams.get('limit') || 50);

  if (date) {
    return NextResponse.json(await BeverageEntry.findByUserAndDate(userId, date));
  }

  if (startDate && endDate) {
    return NextResponse.json(await BeverageEntry.findByUserAndDateRange(userId, startDate, endDate));
  }

  return NextResponse.json(await BeverageEntry.findByUser(userId, limit));
}

export async function POST(request) {
  try {
    const userId = await getCurrentUserId(request);
    const body = await request.json();
    const normalized = normalizeBeverageEntryInput({
      ...body,
      beverageType: 'water',
      countsTowardHydration: true,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      caffeineMg: body.caffeineMg ?? null,
    });
    const entry = await BeverageEntry.create({
      userId,
      ...normalized,
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to log water' }, { status: 400 });
  }
}
