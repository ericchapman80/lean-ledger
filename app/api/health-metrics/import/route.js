import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import * as HealthMetric from '@/lib/models/healthMetric';
import * as User from '@/lib/models/user';
import * as Weight from '@/lib/models/weight';
import { validateHealthMetricEntry } from '@/lib/healthMetrics';

export async function POST(request) {
  const userId = await getCurrentUserId(request);
  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ error: 'Profile not found. Please complete setup.' }, { status: 404 });
  }

  const { rows } = await request.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'Rows are required' }, { status: 400 });
  }

  const results = [];
  let latestWeightedEntry = null;
  for (const row of rows) {
    const { normalized, errors } = validateHealthMetricEntry(row);
    if (errors.length > 0) {
      results.push({ recordedAt: row.recordedAt, imported: false, errors });
      continue;
    }

    await HealthMetric.upsert({ userId, ...normalized });
    if (normalized.weight != null && normalized.date) {
      await Weight.upsert({ userId, date: normalized.date, weight: normalized.weight });
      if (!latestWeightedEntry || normalized.recordedAt > latestWeightedEntry.recordedAt) {
        latestWeightedEntry = normalized;
      }
    }
    results.push({ recordedAt: normalized.recordedAt, imported: true, errors: [] });
  }

  if (latestWeightedEntry?.weight != null) {
    await User.update(userId, { ...user, weight: latestWeightedEntry.weight });
  }

  return NextResponse.json({
    imported: results.filter((result) => result.imported).length,
    failed: results.filter((result) => !result.imported).length,
    results,
  });
}
