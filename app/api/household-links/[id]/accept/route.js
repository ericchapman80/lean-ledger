import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import * as User from '@/lib/models/user';
import {
  findById,
  markAccepted,
} from '@/lib/models/householdLinkInvitation';
import { linkExistingAccountToHousehold } from '@/lib/models/profileHousehold';

export async function POST(request, { params }) {
  try {
    const userId = await getCurrentUserId(request);
    const user = await User.findById(userId);
    const { id } = await params;
    const invitation = await findById(Number(id));

    if (!invitation || invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Invitation not found.' }, { status: 404 });
    }

    if (user?.email?.toLowerCase() !== invitation.invitedEmail.toLowerCase()) {
      return NextResponse.json({ error: 'This invitation is not for your account.' }, { status: 403 });
    }

    await linkExistingAccountToHousehold({
      householdId: invitation.householdId,
      targetUser: user,
      role: invitation.role,
    });

    const accepted = await markAccepted(invitation.id);
    return NextResponse.json(accepted);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to accept invitation.' }, { status: error.status || 500 });
  }
}
