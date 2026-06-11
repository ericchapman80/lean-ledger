import { NextResponse } from 'next/server';
import { getActiveProfileId } from '@/lib/activeProfile';
import { apiRouteErrorResponse } from '@/lib/apiRouteError';
import { calculateNetCarbs } from '@/lib/carbUtils';
import * as Meal from '@/lib/models/meal';
import * as Beverage from '@/lib/models/beverageEntry';
import { calculateBeverageNutritionTotals } from '@/lib/beverages';

export async function GET(request) {
  try {
    const profileId = await getActiveProfileId(request);
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 });
    }

    const meals = await Meal.findByProfileAndDateRange(profileId, startDate, endDate);
    const beverages = await Beverage.findByProfileAndDateRange(profileId, startDate, endDate);

    const byDate = meals.reduce((acc, m) => {
    if (!acc[m.date]) {
      acc[m.date] = {
        protein: 0,
        fat: 0,
        carbs: 0,
        fiber: 0,
        sugarAlcohols: 0,
        netCarbs: 0,
        calories: 0,
        mealCount: 0,
        mealBreakdown: {},
      };
    }
    acc[m.date].protein  += m.protein;
    acc[m.date].fat      += m.fat;
    acc[m.date].carbs    += m.carbs;
    acc[m.date].fiber    += Number(m.fiber || 0);
    acc[m.date].sugarAlcohols += Number(m.sugarAlcohols || 0);
    acc[m.date].netCarbs += calculateNetCarbs(m.carbs, m.fiber, m.sugarAlcohols);
    acc[m.date].calories += m.calories;
    acc[m.date].mealCount += 1;

    const mealType = m.mealType || 'breakfast';
    if (!acc[m.date].mealBreakdown[mealType]) {
      acc[m.date].mealBreakdown[mealType] = {
        mealType,
        count: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
        fiber: 0,
        sugarAlcohols: 0,
        netCarbs: 0,
        calories: 0,
        loggedAt: [],
      };
    }

    const mealSection = acc[m.date].mealBreakdown[mealType];
    mealSection.count += 1;
    mealSection.protein += m.protein;
    mealSection.fat += m.fat;
    mealSection.carbs += m.carbs;
    mealSection.fiber += Number(m.fiber || 0);
    mealSection.sugarAlcohols += Number(m.sugarAlcohols || 0);
    mealSection.netCarbs += calculateNetCarbs(m.carbs, m.fiber, m.sugarAlcohols);
    mealSection.calories += m.calories;
    if (m.createdAt) {
      mealSection.loggedAt.push(m.createdAt);
    }
    return acc;
  }, {});

    for (const beverage of beverages) {
    if (!byDate[beverage.date]) {
      byDate[beverage.date] = {
        protein: 0,
        fat: 0,
        carbs: 0,
        fiber: 0,
        sugarAlcohols: 0,
        netCarbs: 0,
        calories: 0,
        mealCount: 0,
        mealBreakdown: {},
      };
    }
    const beverageTotals = calculateBeverageNutritionTotals([beverage]);
    byDate[beverage.date].protein += beverageTotals.protein;
    byDate[beverage.date].fat += beverageTotals.fat;
    byDate[beverage.date].carbs += beverageTotals.carbs;
    byDate[beverage.date].netCarbs += beverageTotals.carbs;
    byDate[beverage.date].calories += beverageTotals.calories;
  }

    const trends = Object.entries(byDate)
      .map(([date, stats]) => ({
        date,
        ...stats,
        mealBreakdown: Object.values(stats.mealBreakdown || {}).map((mealSection) => ({
          ...mealSection,
          loggedAt: mealSection.loggedAt.sort(),
        })),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(trends);
  } catch (error) {
    return apiRouteErrorResponse(error, 'Failed to fetch trend stats');
  }
}
