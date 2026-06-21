import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { getActiveProfileId } from '@/lib/activeProfile';
import { apiRouteErrorResponse } from '@/lib/apiRouteError';
import * as Profile from '@/lib/models/profile';
import * as Weight from '@/lib/models/weight';
import * as HealthMetric from '@/lib/models/healthMetric';
import * as BodyCompositionGoal from '@/lib/models/bodyCompositionGoal';
import { findMembershipForUser, isHouseholdManager } from '@/lib/models/profileHousehold';
import { buildCompletionSnapshot, getLatestBodyCompositionSnapshot } from '@/lib/bodyCompositionGoals';

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
    const [weightLogs, healthMetrics] = await Promise.all([
      Weight.findByProfile(profile.id, 90),
      HealthMetric.findByProfile(profile.id, 90),
    ]);
    const snapshot = getLatestBodyCompositionSnapshot({ weightLogs, healthMetrics });
    const completion = buildCompletionSnapshot(snapshot);
    if (!completion) {
      return NextResponse.json({ error: 'No current body composition snapshot available.' }, { status: 409 });
    }
    const completed = await BodyCompositionGoal.complete(goal.id, profile.id, completion);
    return NextResponse.json(completed);
  } catch (error) {
    return apiRouteErrorResponse(error, 'Failed to complete body composition goal');
  }
}
