import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { getActiveProfileId } from '@/lib/activeProfile';
import { apiRouteErrorResponse } from '@/lib/apiRouteError';
import * as DailyHabitLog from '@/lib/models/dailyHabitLog';
import * as HabitDefinition from '@/lib/models/habitDefinition';
import { formatDate, getTodayDate } from '@/lib/utils/dateUtils';

export async function GET(request) {
  try {
    const profileId = await getActiveProfileId(request);
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      const today = getTodayDate();
      const logs = await DailyHabitLog.findByProfileAndDateRange(profileId, today, today);
      return NextResponse.json(logs);
    }

    const logs = await DailyHabitLog.findByProfileAndDateRange(profileId, startDate, endDate);
    return NextResponse.json(logs);
  } catch (error) {
    return apiRouteErrorResponse(error, 'Failed to fetch daily habit logs');
  }
}

export async function POST(request) {
  const userId = await getCurrentUserId(request);
  const profileId = await getActiveProfileId(request);
  const body = await request.json();

  const date = body.date ? formatDate(body.date) : null;
  if (!body.habitId || !date) {
    return NextResponse.json({ error: 'habitId and date are required.' }, { status: 400 });
  }

  const habit = await HabitDefinition.findById(profileId, Number(body.habitId));
  if (!habit) {
    return NextResponse.json({ error: 'Habit not found.' }, { status: 404 });
  }

  const completed = body.completed === true || body.completed === 'true';
  const saved = await DailyHabitLog.upsert(profileId, {
    habitId: Number(body.habitId),
    date,
    valueBoolean: completed,
    completed,
  }, userId);

  return NextResponse.json(saved, { status: 201 });
}
