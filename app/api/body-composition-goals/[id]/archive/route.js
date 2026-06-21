import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { getActiveProfileId } from '@/lib/activeProfile';
import { apiRouteErrorResponse } from '@/lib/apiRouteError';
import * as Profile from '@/lib/models/profile';
import * as BodyCompositionGoal from '@/lib/models/bodyCompositionGoal';
import { findMembershipForUser, isHouseholdManager } from '@/lib/models/profileHousehold';

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

export async function POST(request, { params }) {
  try {
    const { profile, goal } = await getAuthorizedGoal(request, params);
    const archived = await BodyCompositionGoal.archive(goal.id, profile.id);
    return NextResponse.json(archived);
  } catch (error) {
    return apiRouteErrorResponse(error, 'Failed to archive body composition goal');
  }
}
