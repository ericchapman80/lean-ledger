import { NextResponse } from 'next/server';
import { getActiveProfileId } from '@/lib/activeProfile';
import { apiRouteErrorResponse } from '@/lib/apiRouteError';
import * as Meal from '@/lib/models/meal';
import { optionalNumberOrNull } from '@/lib/carbUtils';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const profileId = await getActiveProfileId(request);
    const existing = await Meal.findByIdForProfile(id, profileId);
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
      fiber = existing.fiber,
      sugarAlcohols = existing.sugarAlcohols,
      calories,
    } = await request.json();
    if (!mealName || protein == null || fat == null || carbs == null || calories == null) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const meal = await Meal.update(id, profileId, {
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
    return NextResponse.json(meal);
  } catch (error) {
    return apiRouteErrorResponse(error, 'Failed to update meal');
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const profileId = await getActiveProfileId(request);
    const deleted = await Meal.remove(id, profileId);
    if (!deleted) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Meal deleted successfully' });
  } catch (error) {
    return apiRouteErrorResponse(error, 'Failed to delete meal');
  }
}
