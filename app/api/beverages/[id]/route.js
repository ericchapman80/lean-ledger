import { NextResponse } from 'next/server';
import { getActiveProfileId } from '@/lib/activeProfile';
import * as BeverageEntry from '@/lib/models/beverageEntry';
import { normalizeBeverageEntryInput } from '@/lib/beverages';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const profileId = await getActiveProfileId(request);
    const existing = await BeverageEntry.findByIdForProfile(id, profileId);
    if (!existing) {
      return NextResponse.json({ error: 'Beverage entry not found' }, { status: 404 });
    }

    const body = await request.json();
    const normalized = normalizeBeverageEntryInput({
      amount: body.amount ?? existing.amount,
      unit: body.unit ?? existing.unit,
      recordedAt: body.recordedAt ?? existing.recordedAt,
      beverageType: body.beverageType ?? existing.beverageType,
      displayName: body.displayName ?? existing.displayName,
      countsTowardHydration: body.countsTowardHydration ?? existing.countsTowardHydration,
      calories: body.calories ?? existing.calories,
      protein: body.protein ?? existing.protein,
      carbs: body.carbs ?? existing.carbs,
      fat: body.fat ?? existing.fat,
      caffeineMg: body.caffeineMg ?? existing.caffeineMg,
    });

    const entry = await BeverageEntry.update(id, profileId, normalized);
    return NextResponse.json(entry);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to update beverage entry' }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const profileId = await getActiveProfileId(request);
  const deleted = await BeverageEntry.remove(id, profileId);
  if (!deleted) {
    return NextResponse.json({ error: 'Beverage entry not found' }, { status: 404 });
  }
  return NextResponse.json({ message: 'Beverage entry deleted successfully' });
}
