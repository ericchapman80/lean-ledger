import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import * as User from '@/lib/models/user';
import * as Meal from '@/lib/models/meal';
import * as Beverage from '@/lib/models/beverageEntry';
import { enrichProfile } from '@/lib/profile';
import { calculateBeverageNutritionTotals } from '@/lib/beverages';
import { summarizeMealLog } from '@/lib/mealTemplates';

export async function GET(request, { params }) {
  const userId = await getCurrentUserId(request);
  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ error: 'Profile not found. Please complete setup.' }, { status: 404 });
  }

  const { date } = await params;
  const meals = await Meal.findByUserAndDate(userId, date);
  const beverages = await Beverage.findByUserAndDate(userId, date);

  const totals = meals.reduce((acc, m) => ({
    protein: acc.protein + m.protein,
    fat: acc.fat + m.fat,
    carbs: acc.carbs + m.carbs,
    calories: acc.calories + m.calories,
  }), { protein: 0, fat: 0, carbs: 0, calories: 0 });

  const beverageTotals = calculateBeverageNutritionTotals(beverages);

  totals.protein += beverageTotals.protein;
  totals.fat += beverageTotals.fat;
  totals.carbs += beverageTotals.carbs;
  totals.calories += beverageTotals.calories;

  const { activeMacros: targets } = enrichProfile(user);

  const progress = {
    protein:  targets.protein  > 0 ? (totals.protein  / targets.protein)  * 100 : 0,
    fat:      targets.fat      > 0 ? (totals.fat      / targets.fat)      * 100 : 0,
    carbs:    targets.carbs    > 0 ? (totals.carbs    / targets.carbs)    * 100 : 0,
    calories: targets.calories > 0 ? (totals.calories / targets.calories) * 100 : 0,
  };

  const mealSummary = summarizeMealLog(meals);

  return NextResponse.json({
    date,
    meals,
    totals,
    targets,
    progress,
    mealCount: mealSummary.mealCount,
    foodEntryCount: mealSummary.foodEntryCount,
    mealTypes: mealSummary.mealTypes,
    beverageCount: beverages.length,
  });
}
