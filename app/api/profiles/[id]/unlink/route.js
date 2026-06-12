import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { findMembershipForUser, isHouseholdManager, unlinkExistingAccountFromHousehold } from '@/lib/models/profileHousehold';

export async function POST(request, { params }) {
  try {
    const userId = await getCurrentUserId(request);
    const membership = await findMembershipForUser(userId);
    if (!membership || !isHouseholdManager(membership.role)) {
      return NextResponse.json({ error: 'Only a household owner or admin can unlink existing accounts.' }, { status: 403 });
    }

    const { id } = await params;
    const result = await unlinkExistingAccountFromHousehold({
      householdId: membership.householdId,
      profileId: Number(id),
      actingUserId: userId,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to unlink account.' }, { status: error.status || 500 });
  }
}
