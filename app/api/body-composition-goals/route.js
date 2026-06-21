import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { getActiveProfileId } from '@/lib/activeProfile';
import { apiRouteErrorResponse } from '@/lib/apiRouteError';
import * as Profile from '@/lib/models/profile';
import * as Weight from '@/lib/models/weight';
import * as HealthMetric from '@/lib/models/healthMetric';
import * as BodyCompositionGoal from '@/lib/models/bodyCompositionGoal';
import { findMembershipForUser, isHouseholdManager } from '@/lib/models/profileHousehold';
import {
  assertGoalAllowedForProfile,
  buildGoalBaseline,
  decorateGoalWithProgress,
  getLatestBodyCompositionSnapshot,
  normalizeBodyCompositionGoalInput,
  validateBodyCompositionGoalPayload,
} from '@/lib/bodyCompositionGoals';

async function getAuthorizedActiveProfile(request) {
  const userId = await getCurrentUserId(request);
  const profileId = await getActiveProfileId(request);
  const profile = await Profile.findById(profileId);
  if (!profile) {
    const error = new Error('Active profile not found.');
    error.status = 404;
    throw error;
  }

  if (profile.sourceUserId === userId) return { userId, profile };

  const membership = await findMembershipForUser(userId);
  if (!membership || membership.householdId !== profile.householdId || !isHouseholdManager(membership.role)) {
    const error = new Error('Only a household owner or admin can manage this profile goal.');
    error.status = 403;
    throw error;
  }

  return { userId, profile };
}

async function loadGoalView(profileId) {
  const [activeGoal, history, weightLogs, healthMetrics] = await Promise.all([
    BodyCompositionGoal.findActiveByProfile(profileId),
    BodyCompositionGoal.listHistoryByProfile(profileId),
    Weight.findByProfile(profileId, 90),
    HealthMetric.findByProfile(profileId, 90),
  ]);

  const currentSnapshot = getLatestBodyCompositionSnapshot({ weightLogs, healthMetrics });
  return {
    activeGoal: activeGoal ? decorateGoalWithProgress(activeGoal, currentSnapshot, weightLogs) : null,
    history: history.map((goal) => decorateGoalWithProgress(goal, currentSnapshot, weightLogs)),
  };
}

export async function GET(request) {
  try {
    const { profile } = await getAuthorizedActiveProfile(request);
    return NextResponse.json(await loadGoalView(profile.id));
  } catch (error) {
    return apiRouteErrorResponse(error, 'Failed to fetch body composition goals');
  }
}

export async function POST(request) {
  try {
    const { profile } = await getAuthorizedActiveProfile(request);
    assertGoalAllowedForProfile(profile);

    const existing = await BodyCompositionGoal.findActiveByProfile(profile.id);
    if (existing) {
      return NextResponse.json({ error: 'Only one active body composition goal is allowed per profile.' }, { status: 409 });
    }

    const body = await request.json();
    const error = validateBodyCompositionGoalPayload(body);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const normalized = normalizeBodyCompositionGoalInput(body);
    const [weightLogs, healthMetrics] = await Promise.all([
      Weight.findByProfile(profile.id, 90),
      HealthMetric.findByProfile(profile.id, 90),
    ]);
    const snapshot = getLatestBodyCompositionSnapshot({ weightLogs, healthMetrics });
    const baseline = buildGoalBaseline(snapshot);
    if (!baseline) {
      return NextResponse.json({ error: 'Add a current weight or body composition entry before creating a goal.' }, { status: 409 });
    }

    const created = await BodyCompositionGoal.create({
      profileId: profile.id,
      ...normalized,
      ...baseline,
    });

    return NextResponse.json(decorateGoalWithProgress(created, snapshot, weightLogs), { status: 201 });
  } catch (error) {
    return apiRouteErrorResponse(error, 'Failed to create body composition goal');
  }
}
