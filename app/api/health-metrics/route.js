import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import * as HealthMetric from '@/lib/models/healthMetric';
import * as User from '@/lib/models/user';
import * as Weight from '@/lib/models/weight';
import { validateHealthMetricEntry } from '@/lib/healthMetrics';

async function syncWeight(userId, user, entry) {
  if (entry.weight == null || !entry.date) return;
  await Weight.upsert({ userId, date: entry.date, weight: entry.weight });
  await User.update(userId, { ...user, weight: entry.weight });
}

export async function GET(request) {
  const userId = await getCurrentUserId(request);
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const limit = searchParams.get('limit');

  const metrics = (startDate && endDate)
    ? await HealthMetric.findByUserAndDateRange(userId, startDate, endDate)
    : await HealthMetric.findByUser(userId, limit ? parseInt(limit, 10) : 30);

  return NextResponse.json(metrics);
}

export async function POST(request) {
  const userId = await getCurrentUserId(request);
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

  const saved = await HealthMetric.upsert({ userId, ...normalized });
  await syncWeight(userId, user, normalized);

  return NextResponse.json(saved, { status: 201 });
}
