import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { getActiveProfileId } from '@/lib/activeProfile';
import { apiRouteErrorResponse } from '@/lib/apiRouteError';
import * as Profile from '@/lib/models/profile';
import { findMembershipForUser, isHouseholdManager } from '@/lib/models/profileHousehold';
import { validateProfilePayload } from '@/lib/profile';

export async function GET(request) {
  try {
    const userId = await getCurrentUserId(request);
    const membership = await findMembershipForUser(userId);
    if (!membership) return NextResponse.json([]);
    const [profiles, activeProfileId] = await Promise.all([
      Profile.listByHousehold(membership.householdId),
      getActiveProfileId(request),
    ]);
    const withActive = profiles.map((p) => ({ ...p, isActive: p.id === activeProfileId }));
    return NextResponse.json(withActive);
  } catch (error) {
    return apiRouteErrorResponse(error, 'Failed to fetch profiles');
  }
}

export async function POST(request) {
  try {
    const userId = await getCurrentUserId(request);
    const membership = await findMembershipForUser(userId);
    if (!membership || !isHouseholdManager(membership.role)) {
      return NextResponse.json({ error: 'Only a household owner or admin can add profiles.' }, { status: 403 });
    }

    const body = await request.json();
    const name = body?.name?.trim();
    if (!name) return NextResponse.json({ error: 'Profile name is required.' }, { status: 400 });

    const error = validateProfilePayload(body);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const profile = await Profile.createDependent({
      householdId: membership.householdId,
      managedByUserId: userId,
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

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    return apiRouteErrorResponse(error, 'Failed to create profile');
  }
}
