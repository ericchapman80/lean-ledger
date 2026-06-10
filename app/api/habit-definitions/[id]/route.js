import { NextResponse } from 'next/server';
import { getActiveProfileId } from '@/lib/activeProfile';
import * as HabitDefinition from '@/lib/models/habitDefinition';

export async function PUT(request, context) {
  const profileId = await getActiveProfileId(request);
  const { id } = await context.params;
  const body = await request.json();

  const payload = {};
  if (body.name != null) {
    const trimmedName = body.name.trim();
    if (!trimmedName) {
      return NextResponse.json({ error: 'Habit name is required.' }, { status: 400 });
    }
    if (trimmedName.length > 40) {
      return NextResponse.json({ error: 'Habit name must be 40 characters or fewer.' }, { status: 400 });
    }
    payload.name = trimmedName;
  }
  if (body.isActive != null) payload.isActive = Boolean(body.isActive);
  if (body.sortOrder != null) payload.sortOrder = Number(body.sortOrder);

  const updated = await HabitDefinition.update(profileId, Number(id), payload);
  if (!updated) {
    return NextResponse.json({ error: 'Habit not found.' }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(request, context) {
  const profileId = await getActiveProfileId(request);
  const { id } = await context.params;
  const deleted = await HabitDefinition.deleteById(profileId, Number(id));

  if (!deleted) {
    return NextResponse.json({ error: 'Habit not found.' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
