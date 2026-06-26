import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { getActiveProfileId } from '@/lib/activeProfile';
import { apiRouteErrorResponse } from '@/lib/apiRouteError';
import * as PerformanceMetric from '@/lib/models/performanceMetric';
import * as User from '@/lib/models/user';
import { validatePerformanceMetricEntry } from '@/lib/performanceMetrics';

export async function GET(request) {
  try {
    const profileId = await getActiveProfileId(request);
    if (!profileId) {
      return NextResponse.json([]);
    }
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = Number.parseInt(searchParams.get('limit') || '50', 10);

    const rows = await PerformanceMetric.findByProfile(profileId, {
      startDate,
      endDate,
      limit: Number.isFinite(limit) ? limit : 50,
    });
    return NextResponse.json(rows);
  } catch (error) {
    return apiRouteErrorResponse(error, 'Failed to fetch performance metrics');
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
    const { normalized, errors } = validatePerformanceMetricEntry(body, user.units || 'metric');
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(' ') }, { status: 400 });
    }

    const saved = await PerformanceMetric.create({
      userId,
      profileId,
      ...normalized,
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    return apiRouteErrorResponse(error, 'Failed to save performance metric');
  }
}
