import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import * as User from '@/lib/models/user';
import * as Profile from '@/lib/models/profile';
import {
  createInvitation,
  findActiveByHouseholdAndEmail,
  listReceivedForUser,
  listSentForHousehold,
} from '@/lib/models/householdLinkInvitation';
import { findMembershipForUser, isHouseholdManager } from '@/lib/models/profileHousehold';

export async function GET(request) {
  try {
    const userId = await getCurrentUserId(request);
    const user = await User.findById(userId);
    const membership = await findMembershipForUser(userId);

    const [received, sent] = await Promise.all([
      listReceivedForUser({ userId, email: user?.email }),
      membership ? listSentForHousehold(membership.householdId) : [],
    ]);

    return NextResponse.json({ received, sent, canManage: membership ? isHouseholdManager(membership.role) : false });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to load household links.' }, { status: error.status || 500 });
  }
}

export async function POST(request) {
  try {
    const userId = await getCurrentUserId(request);
    const membership = await findMembershipForUser(userId);
    if (!membership || !isHouseholdManager(membership.role)) {
      return NextResponse.json({ error: 'Only a household owner or admin can link existing accounts.' }, { status: 403 });
    }

    const body = await request.json();
    const invitedEmail = body?.email?.trim().toLowerCase();
    const role = body?.role === 'admin' ? 'admin' : 'member';
    const note = body?.note?.trim() || null;

    if (!invitedEmail || !invitedEmail.includes('@')) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    }

    const user = await User.findByEmail(invitedEmail);
    if (!user) {
      return NextResponse.json({ error: 'No existing Lean Ledger account was found for that email.' }, { status: 404 });
    }

    const primaryProfile = await Profile.findPrimaryByUserId(user.id);
    if (primaryProfile?.household_id === membership.householdId) {
      return NextResponse.json({ error: 'That account is already in this household.' }, { status: 409 });
    }

    const existing = await findActiveByHouseholdAndEmail(membership.householdId, invitedEmail);
    if (existing) {
      return NextResponse.json({ error: 'A pending invitation already exists for that account.' }, { status: 409 });
    }

    const invitation = await createInvitation({
      householdId: membership.householdId,
      invitedEmail,
      invitedUserId: user.id,
      invitedByUserId: userId,
      role,
      note,
    });

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to create household link invitation.' }, { status: error.status || 500 });
  }
}
