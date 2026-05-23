import { NextResponse } from 'next/server';
import * as Meal from '@/lib/models/meal';

export async function PUT(request, { params }) {
  const { id } = await params;
  const existing = await Meal.findById(id);
  if (!existing) {
    return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
  }

  const { mealName, protein, fat, carbs, calories } = await request.json();
  if (!mealName || protein == null || fat == null || carbs == null || calories == null) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  const meal = await Meal.update(id, {
    mealName,
    protein: Number(protein),
    fat: Number(fat),
    carbs: Number(carbs),
    calories: Number(calories),
  });
  return NextResponse.json(meal);
}

export async function DELETE(_request, { params }) {
  const { id } = await params;
  const deleted = await Meal.remove(id);
  if (!deleted) {
    return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
  }
  return NextResponse.json({ message: 'Meal deleted successfully' });
}
