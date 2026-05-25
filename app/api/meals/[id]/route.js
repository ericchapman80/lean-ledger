import { NextResponse } from 'next/server';
import * as Meal from '@/lib/models/meal';

export async function PUT(request, { params }) {
  const { id } = await params;
  const existing = await Meal.findById(id);
  if (!existing) {
    return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
  }

  const {
    mealName,
    mealType = existing.mealType || 'breakfast',
    portionAmount = existing.portionAmount,
    portionUnit = existing.portionUnit,
    portionGrams = existing.portionGrams,
    protein,
    fat,
    carbs,
    calories,
  } = await request.json();
  if (!mealName || protein == null || fat == null || carbs == null || calories == null) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  const meal = await Meal.update(id, {
    mealName,
    mealType,
    portionAmount: portionAmount == null || portionAmount === '' ? null : Number(portionAmount),
    portionUnit: portionUnit || null,
    portionGrams: portionGrams == null || portionGrams === '' ? null : Number(portionGrams),
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
