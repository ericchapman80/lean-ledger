import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { getActiveProfileId } from '@/lib/activeProfile';
import { apiRouteErrorResponse } from '@/lib/apiRouteError';
import * as Meal from '@/lib/models/meal';
import { optionalNumberOrNull } from '@/lib/carbUtils';
import { getRequestLocalDate } from '@/lib/utils/dateUtils';

export async function GET(request) {
  try {
    const profileId = await getActiveProfileId(request);
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let meals;
    if (startDate && endDate) {
      meals = await Meal.findByProfileAndDateRange(profileId, startDate, endDate);
    } else {
      const targetDate = date ?? getRequestLocalDate(request);
      meals = await Meal.findByProfileAndDate(profileId, targetDate);
    }
    return NextResponse.json(meals);
  } catch (error) {
    return apiRouteErrorResponse(error, 'Failed to fetch meals');
  }
}

export async function POST(request) {
  try {
    const userId = await getCurrentUserId(request);
    const profileId = await getActiveProfileId(request);
    const {
      date,
      mealName,
      mealType = 'breakfast',
      portionAmount = null,
      portionUnit = null,
      portionGrams = null,
      protein,
      fat,
      carbs,
      fiber = null,
      sugarAlcohols = null,
      calories,
    } = await request.json();

    const targetDate = date || getRequestLocalDate(request);

    if (!targetDate || !mealName || protein == null || fat == null || carbs == null || calories == null) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const meal = await Meal.create({
      userId,
      profileId,
      date: targetDate,
      mealName,
      mealType,
      portionAmount: portionAmount == null || portionAmount === '' ? null : Number(portionAmount),
      portionUnit: portionUnit || null,
      portionGrams: portionGrams == null || portionGrams === '' ? null : Number(portionGrams),
      protein: Number(protein),
      fat: Number(fat),
      carbs: Number(carbs),
      fiber: optionalNumberOrNull(fiber),
      sugarAlcohols: optionalNumberOrNull(sugarAlcohols),
      calories: Number(calories),
    });
    return NextResponse.json(meal, { status: 201 });
  } catch (error) {
    return apiRouteErrorResponse(error, 'Failed to create meal');
  }
}
