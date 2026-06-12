import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import * as User from '@/lib/models/user';
import {
  findById,
  markDeclined,
} from '@/lib/models/householdLinkInvitation';

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

    const declined = await markDeclined(invitation.id);
    return NextResponse.json(declined);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to decline invitation.' }, { status: error.status || 500 });
  }
}
