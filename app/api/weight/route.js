import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { apiRouteErrorResponse } from '@/lib/apiRouteError';
import * as Weight from '@/lib/models/weight';
import * as User from '@/lib/models/user';
import { getRequestLocalDate } from '@/lib/utils/dateUtils';

export async function GET(request) {
  try {
    const userId = await getCurrentUserId(request);
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = searchParams.get('limit');

    const weights = (startDate && endDate)
      ? await Weight.findByUserAndDateRange(userId, startDate, endDate)
      : await Weight.findByUser(userId, limit ? parseInt(limit, 10) : 30);

    return NextResponse.json(weights);
  } catch (error) {
    return apiRouteErrorResponse(error, 'Failed to fetch weight logs');
  }
}

export async function POST(request) {
  const userId = await getCurrentUserId(request);
  const { date, weight } = await request.json();
  const targetDate = date || getRequestLocalDate(request);

  if (!targetDate || !weight) {
    return NextResponse.json({ error: 'Date and weight are required' }, { status: 400 });
  }

  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ error: 'Profile not found. Please complete setup.' }, { status: 404 });
  }

  const weightLog = await Weight.upsert({ userId, date: targetDate, weight: Number(weight) });
  // Logging weight updates the user's current weight so TDEE recalculates on next macro fetch.
  await User.update(userId, { ...user, weight: Number(weight) });

  return NextResponse.json(weightLog, { status: 201 });
}
