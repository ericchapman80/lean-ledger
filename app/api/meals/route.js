import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import * as Meal from '@/lib/models/meal';
import { optionalNumberOrNull } from '@/lib/carbUtils';
import { getRequestLocalDate } from '@/lib/utils/dateUtils';

export async function GET(request) {
  const userId = await getCurrentUserId(request);
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  let meals;
  if (startDate && endDate) {
    meals = await Meal.findByUserAndDateRange(userId, startDate, endDate);
  } else {
    const targetDate = date ?? getRequestLocalDate(request);
    meals = await Meal.findByUserAndDate(userId, targetDate);
  }
  return NextResponse.json(meals);
}

export async function POST(request) {
  const userId = await getCurrentUserId(request);
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
}
