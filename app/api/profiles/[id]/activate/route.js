import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { apiRouteErrorResponse } from '@/lib/apiRouteError';
import { ACTIVE_PROFILE_COOKIE } from '@/lib/activeProfile';
import * as Profile from '@/lib/models/profile';

// Switch the active profile. Only profiles in a household the caller belongs to
// can be activated; the id is validated here before the cookie is written, and
// getActiveProfileId re-validates it on every request as defense in depth.
export async function POST(request, { params }) {
  try {
    const userId = await getCurrentUserId(request);
    const { id } = await params;
    const profileId = Number(id);

    if (!Number.isInteger(profileId) || !(await Profile.isAccessibleToUser(profileId, userId))) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    }

    const response = NextResponse.json({ activeProfileId: profileId });
    response.cookies.set(ACTIVE_PROFILE_COOKIE, String(profileId), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  } catch (error) {
    return apiRouteErrorResponse(error, 'Failed to activate profile');
  }
}
