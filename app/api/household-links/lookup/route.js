import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import * as User from '@/lib/models/user';
import * as Profile from '@/lib/models/profile';
import { findMembershipForUser, isHouseholdManager } from '@/lib/models/profileHousehold';
import { findActiveByHouseholdAndEmail } from '@/lib/models/householdLinkInvitation';

export async function GET(request) {
  try {
    const userId = await getCurrentUserId(request);
    const membership = await findMembershipForUser(userId);
    if (!membership || !isHouseholdManager(membership.role)) {
      return NextResponse.json({ error: 'Only a household owner or admin can link existing accounts.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return NextResponse.json({ exists: false, email });
    }

    const primaryProfile = await Profile.findPrimaryByUserId(user.id);
    const alreadyInHousehold = primaryProfile?.household_id === membership.householdId;
    const pendingInvite = await findActiveByHouseholdAndEmail(membership.householdId, email);

    return NextResponse.json({
      exists: true,
      email,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      alreadyInHousehold,
      pendingInvite,
      canInvite: !alreadyInHousehold && !pendingInvite,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Lookup failed.' }, { status: error.status || 500 });
  }
}
