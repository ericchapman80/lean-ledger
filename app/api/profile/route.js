import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { resolveActiveCoachingSubject } from '@/lib/activeProfile';
import { apiRouteErrorResponse } from '@/lib/apiRouteError';
import * as User from '@/lib/models/user';
import * as Profile from '@/lib/models/profile';
import { enrichProfile, hasCompletedProfile, validateProfilePayload } from '@/lib/profile';

// /api/profile is the *active* profile: when viewing as yourself (primary) it is
// the account-holder's users row (unchanged behavior); when switched to a
// dependent it is that profile's row, so the dashboard/targets reflect — and
// stay youth-safe for — whoever is active.
export async function GET(request) {
  try {
    const { subject } = await resolveActiveCoachingSubject(request);
    if (!subject || !hasCompletedProfile(subject)) {
      return NextResponse.json({ error: 'Profile not found. Please complete setup.', needsProfile: true }, { status: 404 });
    }
    return NextResponse.json(enrichProfile(subject));
  } catch (error) {
    return apiRouteErrorResponse(error, 'Failed to fetch profile');
  }
}

export async function POST(request) {
  try {
    const userId = await getCurrentUserId(request);
    const { isPrimary, profileId, householdId } = await resolveActiveCoachingSubject(request);
    const body = await request.json();

    const error = validateProfilePayload(body);
    if (error) return NextResponse.json({ error }, { status: 400 });

    if (isPrimary) {
      const existing = await User.findById(userId);
      const user = existing
        ? await User.update(userId, body)
        : await User.createWithId(userId, body);
      return NextResponse.json(enrichProfile(user));
    }

    // Editing a dependent's own profile while viewing as them.
    const updated = await Profile.update(profileId, householdId, body);
    if (!updated) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    return NextResponse.json(enrichProfile(updated));
  } catch (error) {
    return apiRouteErrorResponse(error, 'Failed to save profile');
  }
}
