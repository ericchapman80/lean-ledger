import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { apiRouteErrorResponse } from '@/lib/apiRouteError';
import * as User from '@/lib/models/user';
import * as Meal from '@/lib/models/meal';
import * as Beverage from '@/lib/models/beverageEntry';
import * as Weight from '@/lib/models/weight';
import { enrichProfile } from '@/lib/profile';
import { calculateWeeklyNutritionSummary } from '@/lib/weeklyStats';
import { getDateDaysBefore, getEndOfWeek, getRequestLocalDate, getStartOfWeek } from '@/lib/utils/dateUtils';

export async function GET(request) {
  try {
    const userId = await getCurrentUserId(request);
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'Profile not found. Please complete setup.' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || getRequestLocalDate(request);
    const weekStart = getStartOfWeek(date);
    const weekEnd = getEndOfWeek(date);
    const rollingWeightStart = getDateDaysBefore(date, 6);
    const meals = await Meal.findByUserAndDateRange(userId, weekStart, weekEnd);
    const beverages = await Beverage.findByUserAndDateRange(userId, weekStart, weekEnd);
    const weights = await Weight.findByUserAndDateRange(userId, rollingWeightStart, date);
    const { activeMacros: targets } = enrichProfile(user);
    const summary = calculateWeeklyNutritionSummary({
      date,
      targets,
      meals,
      beverages,
      weights,
      dietStyle: user.dietStyle,
    });

    return NextResponse.json(summary);
  } catch (error) {
    return apiRouteErrorResponse(error, 'Failed to fetch weekly stats');
  }
}
