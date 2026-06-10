import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { getActiveProfileId } from '@/lib/activeProfile';
import { apiRouteErrorResponse } from '@/lib/apiRouteError';
import * as User from '@/lib/models/user';
import * as Meal from '@/lib/models/meal';
import * as Beverage from '@/lib/models/beverageEntry';
import { buildCarbTrackingSummary, calculateNutritionTotals } from '@/lib/carbUtils';
import { enrichProfile } from '@/lib/profile';
import { calculateBeverageNutritionTotals } from '@/lib/beverages';
import { summarizeMealLog } from '@/lib/mealTemplates';

export async function GET(request, { params }) {
  try {
    const userId = await getCurrentUserId(request);
    const profileId = await getActiveProfileId(request);
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'Profile not found. Please complete setup.' }, { status: 404 });
    }

    const { date } = await params;
    const meals = await Meal.findByProfileAndDate(profileId, date);
    const beverages = await Beverage.findByProfileAndDate(profileId, date);

    const totals = calculateNutritionTotals(meals);

    const beverageTotals = calculateBeverageNutritionTotals(beverages);

    totals.protein += beverageTotals.protein;
    totals.fat += beverageTotals.fat;
    totals.carbs += beverageTotals.carbs;
    totals.netCarbs += beverageTotals.carbs;
    totals.calories += beverageTotals.calories;

    const { activeMacros: targets } = enrichProfile(user);
    const carbTracking = buildCarbTrackingSummary({
      dietStyle: user.dietStyle,
      totals,
      targetCarbs: targets.carbs,
    });

    const progress = {
      protein:  targets.protein  > 0 ? (totals.protein  / targets.protein)  * 100 : 0,
      fat:      targets.fat      > 0 ? (totals.fat      / targets.fat)      * 100 : 0,
      carbs:    targets.carbs    > 0 ? (carbTracking.current / targets.carbs) * 100 : 0,
      calories: targets.calories > 0 ? (totals.calories / targets.calories) * 100 : 0,
    };

    const mealSummary = summarizeMealLog(meals);

    return NextResponse.json({
      date,
      meals,
      totals,
      targets,
      carbTracking,
      progress,
      mealCount: mealSummary.mealCount,
      foodEntryCount: mealSummary.foodEntryCount,
      mealTypes: mealSummary.mealTypes,
      beverageCount: beverages.length,
    });
  } catch (error) {
    return apiRouteErrorResponse(error, 'Failed to fetch daily stats');
  }
}
