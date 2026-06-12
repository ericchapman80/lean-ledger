import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { getActiveProfileId, resolveActiveCoachingSubject } from '@/lib/activeProfile';
import { apiRouteErrorResponse } from '@/lib/apiRouteError';
import * as HealthMetric from '@/lib/models/healthMetric';
import * as User from '@/lib/models/user';
import * as Weight from '@/lib/models/weight';
import { validateHealthMetricEntry } from '@/lib/healthMetrics';

async function syncWeight(userId, profileId, user, entry, isPrimary) {
  if (entry.weight == null || !entry.date) return;
  await Weight.upsert({ userId, profileId, date: entry.date, weight: entry.weight });
  if (isPrimary) {
    await User.update(userId, { ...user, weight: entry.weight });
  }
}

export async function GET(request) {
  try {
    const profileId = await getActiveProfileId(request);
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = searchParams.get('limit');

    const metrics = (startDate && endDate)
      ? await HealthMetric.findByProfileAndDateRange(profileId, startDate, endDate)
      : await HealthMetric.findByProfile(profileId, limit ? parseInt(limit, 10) : 30);

    return NextResponse.json(metrics);
  } catch (error) {
    return apiRouteErrorResponse(error, 'Failed to fetch health metrics');
  }
}

export async function POST(request) {
  try {
    const userId = await getCurrentUserId(request);
    const profileId = await getActiveProfileId(request);
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'Profile not found. Please complete setup.' }, { status: 404 });
    }

    const body = await request.json();
    const { normalized, errors } = validateHealthMetricEntry(body, {
      units: user.units || 'metric',
      inputMode: 'display',
    });
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join('. ') }, { status: 400 });
    }

    const saved = await HealthMetric.upsert({ userId, profileId, ...normalized });
    const { isPrimary } = await resolveActiveCoachingSubject(request);
    await syncWeight(userId, profileId, user, normalized, isPrimary);

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    return apiRouteErrorResponse(error, 'Failed to save health metric');
  }
}
