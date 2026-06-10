import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { getActiveProfileId } from '@/lib/activeProfile';
import { apiRouteErrorResponse } from '@/lib/apiRouteError';
import * as Weight from '@/lib/models/weight';
import * as User from '@/lib/models/user';
import { getRequestLocalDate } from '@/lib/utils/dateUtils';

export async function GET(request) {
  try {
    const profileId = await getActiveProfileId(request);
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = searchParams.get('limit');

    const weights = (startDate && endDate)
      ? await Weight.findByProfileAndDateRange(profileId, startDate, endDate)
      : await Weight.findByProfile(profileId, limit ? parseInt(limit, 10) : 30);

    return NextResponse.json(weights);
  } catch (error) {
    return apiRouteErrorResponse(error, 'Failed to fetch weight logs');
  }
}

export async function POST(request) {
  try {
    const userId = await getCurrentUserId(request);
    const profileId = await getActiveProfileId(request);
    const { date, weight } = await request.json();
    const targetDate = date || getRequestLocalDate(request);

    if (!targetDate || !weight) {
      return NextResponse.json({ error: 'Date and weight are required' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'Profile not found. Please complete setup.' }, { status: 404 });
    }

    const weightLog = await Weight.upsert({ userId, profileId, date: targetDate, weight: Number(weight) });
    // Logging weight updates the user's current weight so TDEE recalculates on next macro fetch.
    // Per-profile coaching state (using profiles.weight) lands when profiles become the coaching
    // source in a later phase; until then dependent profiles aren't creatable so this stays correct.
    await User.update(userId, { ...user, weight: Number(weight) });

    return NextResponse.json(weightLog, { status: 201 });
  } catch (error) {
    return apiRouteErrorResponse(error, 'Failed to log weight');
  }
}
