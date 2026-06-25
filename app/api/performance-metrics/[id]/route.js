import { NextResponse } from 'next/server';
import { getActiveProfileId } from '@/lib/activeProfile';
import { apiRouteErrorResponse } from '@/lib/apiRouteError';
import * as PerformanceMetric from '@/lib/models/performanceMetric';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const profileId = await getActiveProfileId(request);
    const deleted = await PerformanceMetric.deleteByIdForProfile(Number(id), profileId);
    if (!deleted) {
      return NextResponse.json({ error: 'Performance metric not found.' }, { status: 404 });
    }
    return NextResponse.json(deleted);
  } catch (error) {
    return apiRouteErrorResponse(error, 'Failed to delete performance metric');
  }
}
