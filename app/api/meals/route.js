import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import * as Meal from '@/lib/models/meal';

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
    const targetDate = date ?? new Date().toISOString().split('T')[0];
    meals = await Meal.findByUserAndDate(userId, targetDate);
  }
  return NextResponse.json(meals);
}

export async function POST(request) {
  const userId = await getCurrentUserId(request);
  const { date, mealName, protein, fat, carbs, calories } = await request.json();

  if (!date || !mealName || protein == null || fat == null || carbs == null || calories == null) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  const meal = await Meal.create({
    userId,
    date,
    mealName,
    protein: Number(protein),
    fat: Number(fat),
    carbs: Number(carbs),
    calories: Number(calories),
  });
  return NextResponse.json(meal, { status: 201 });
}
