import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { apiRouteErrorResponse } from '@/lib/apiRouteError';
import * as Profile from '@/lib/models/profile';
import { findMembershipForUser, isHouseholdManager } from '@/lib/models/profileHousehold';
import { validateProfilePayload } from '@/lib/profile';

// PUT/DELETE operate on dependent profiles only. A user's own (primary) profile
// is edited via /api/profile, which keeps the users table in sync; routing
// primary edits through here would let the two diverge.
export async function PUT(request, { params }) {
  try {
    const userId = await getCurrentUserId(request);
    const { id } = await params;
    const membership = await findMembershipForUser(userId);
    if (!membership || !isHouseholdManager(membership.role)) {
      return NextResponse.json({ error: 'Only a household owner or admin can edit profiles.' }, { status: 403 });
    }

    const existing = await Profile.findByIdInHousehold(Number(id), membership.householdId);
    if (!existing) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    if (existing.isPrimary) {
      return NextResponse.json({ error: 'Edit your own profile from the Profile page.' }, { status: 400 });
    }

    const body = await request.json();
    const name = body?.name?.trim() || existing.name;
    const error = validateProfilePayload(body);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const updated = await Profile.update(Number(id), membership.householdId, {
      name,
      dateOfBirth: body.dateOfBirth,
      age: body.age ?? null,
      height: body.height,
      weight: body.weight,
      gender: body.gender,
      activityLevel: body.activityLevel,
      goal: body.goal,
      goalStrategy: body.goalStrategy,
      activityFocus: body.activityFocus,
      dietStyle: body.dietStyle,
      units: body.units,
      dailyWinsActiveKeys: body.dailyWinsActiveKeys,
      dailyWinsTemplateKey: body.dailyWinsTemplateKey,
      dailyWinsChallengeStartDate: body.dailyWinsChallengeStartDate,
      customMacros: body.customMacros,
    });
    return NextResponse.json(updated);
  } catch (error) {
    return apiRouteErrorResponse(error, 'Failed to update profile');
  }
}

export async function DELETE(request, { params }) {
  try {
    const userId = await getCurrentUserId(request);
    const { id } = await params;
    const membership = await findMembershipForUser(userId);
    if (!membership || !isHouseholdManager(membership.role)) {
      return NextResponse.json({ error: 'Only a household owner or admin can remove profiles.' }, { status: 403 });
    }

    // removeDependent refuses to delete a primary (source_user_id IS NULL guard)
    // and is scoped to the caller's household.
    const removed = await Profile.removeDependent(Number(id), membership.householdId);
    if (!removed) {
      return NextResponse.json({ error: 'Profile not found or cannot be removed.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Profile removed successfully' });
  } catch (error) {
    return apiRouteErrorResponse(error, 'Failed to remove profile');
  }
}
