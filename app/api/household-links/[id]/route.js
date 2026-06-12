import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { findById, revoke } from '@/lib/models/householdLinkInvitation';
import { findMembershipForUser, isHouseholdManager } from '@/lib/models/profileHousehold';

export async function DELETE(request, { params }) {
  try {
    const userId = await getCurrentUserId(request);
    const membership = await findMembershipForUser(userId);
    const { id } = await params;
    const invitation = await findById(Number(id));

    if (!membership || !isHouseholdManager(membership.role) || !invitation || invitation.householdId !== membership.householdId) {
      return NextResponse.json({ error: 'Invitation not found.' }, { status: 404 });
    }

    const revoked = await revoke(invitation.id);
    return NextResponse.json(revoked);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to revoke invitation.' }, { status: error.status || 500 });
  }
}
