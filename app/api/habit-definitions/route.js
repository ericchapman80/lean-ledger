import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import * as HabitDefinition from '@/lib/models/habitDefinition';

function validateHabitDefinitionPayload(body) {
  const name = body?.name?.trim();
  if (!name) return 'Habit name is required.';
  if (name.length > 40) return 'Habit name must be 40 characters or fewer.';
  return null;
}

export async function GET(request) {
  const userId = await getCurrentUserId(request);
  const habits = await HabitDefinition.findByUser(userId);
  return NextResponse.json(habits);
}

export async function POST(request) {
  const userId = await getCurrentUserId(request);
  const body = await request.json();

  const error = validateHabitDefinitionPayload(body);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  try {
    const habit = await HabitDefinition.create(userId, {
      name: body.name.trim(),
      inputType: 'boolean',
      category: 'custom',
      isActive: body.isActive ?? true,
    });
    return NextResponse.json(habit, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to create habit' }, { status: 400 });
  }
}
