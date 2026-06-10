import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { getActiveProfileId } from '@/lib/activeProfile';
import { apiRouteErrorResponse } from '@/lib/apiRouteError';
import * as BeverageEntry from '@/lib/models/beverageEntry';
import { normalizeBeverageEntryInput } from '@/lib/beverages';

export async function GET(request) {
  try {
    const profileId = await getActiveProfileId(request);
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = Number(searchParams.get('limit') || 50);

    if (date) {
      return NextResponse.json(await BeverageEntry.findByProfileAndDate(profileId, date));
    }

    if (startDate && endDate) {
      return NextResponse.json(await BeverageEntry.findByProfileAndDateRange(profileId, startDate, endDate));
    }

    return NextResponse.json(await BeverageEntry.findByProfile(profileId, limit));
  } catch (error) {
    return apiRouteErrorResponse(error, 'Failed to fetch beverages');
  }
}

export async function POST(request) {
  try {
    const userId = await getCurrentUserId(request);
    const profileId = await getActiveProfileId(request);
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
      profileId,
      ...normalized,
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to log water' }, { status: 400 });
  }
}
