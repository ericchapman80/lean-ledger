import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { getActiveProfileId } from '@/lib/activeProfile';
import { apiRouteErrorResponse } from '@/lib/apiRouteError';
import * as Profile from '@/lib/models/profile';
import * as BodyCompositionGoal from '@/lib/models/bodyCompositionGoal';
import { findMembershipForUser, isHouseholdManager } from '@/lib/models/profileHousehold';
import {
  assertGoalAllowedForProfile,
  normalizeBodyCompositionGoalInput,
  validateBodyCompositionGoalPayload,
} from '@/lib/bodyCompositionGoals';

async function getAuthorizedGoal(request, params) {
  const userId = await getCurrentUserId(request);
  const profileId = await getActiveProfileId(request);
  const profile = await Profile.findById(profileId);
  if (!profile) {
    const error = new Error('Active profile not found.');
    error.status = 404;
    throw error;
  }

  if (profile.sourceUserId !== userId) {
    const membership = await findMembershipForUser(userId);
    if (!membership || membership.householdId !== profile.householdId || !isHouseholdManager(membership.role)) {
      const error = new Error('Only a household owner or admin can manage this profile goal.');
      error.status = 403;
      throw error;
    }
  }

  const { id } = await params;
  const goal = await BodyCompositionGoal.findByIdForProfile(Number(id), profile.id);
  if (!goal) {
    const error = new Error('Goal not found.');
    error.status = 404;
    throw error;
  }

  return { profile, goal };
}

export async function PATCH(request, { params }) {
  try {
    const { profile, goal } = await getAuthorizedGoal(request, params);
    assertGoalAllowedForProfile(profile);
    const body = await request.json();
    const merged = {
      name: body.name ?? goal.name,
      phaseType: body.phaseType ?? goal.phaseType,
      goalWeight: body.goalWeight ?? goal.goalWeight,
      goalBodyFatPercent: body.goalBodyFatPercent ?? goal.goalBodyFatPercent,
      targetBodyFatMin: body.targetBodyFatMin ?? goal.targetBodyFatMin,
      targetBodyFatMax: body.targetBodyFatMax ?? goal.targetBodyFatMax,
      minimumLeanMass: body.minimumLeanMass ?? goal.minimumLeanMass,
      minimumMuscleMass: body.minimumMuscleMass ?? goal.minimumMuscleMass,
      goalLeanMass: body.goalLeanMass ?? goal.goalLeanMass,
      goalMuscleMass: body.goalMuscleMass ?? goal.goalMuscleMass,
      targetDate: body.targetDate ?? goal.targetDate,
    };
    const error = validateBodyCompositionGoalPayload(merged);
    if (error) return NextResponse.json({ error }, { status: 400 });
    const updated = await BodyCompositionGoal.update(goal.id, profile.id, normalizeBodyCompositionGoalInput(merged));
    return NextResponse.json(updated);
  } catch (error) {
    return apiRouteErrorResponse(error, 'Failed to update body composition goal');
  }
}
