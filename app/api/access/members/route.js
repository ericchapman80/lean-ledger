import { NextResponse } from 'next/server';
import { normalizeMemberPayload, requireAdminUserId } from '@/lib/accessControl';
import * as AllowedEmail from '@/lib/models/allowedEmail';

export async function GET(request) {
  try {
    await requireAdminUserId(request);
    const members = await AllowedEmail.listAll();
    return NextResponse.json(members);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Admin access required.' }, { status: error.status || 500 });
  }
}

export async function POST(request) {
  try {
    const adminUserId = await requireAdminUserId(request);
    const body = await request.json();
    const payload = normalizeMemberPayload(body);
    const existing = await AllowedEmail.findByEmail(payload.email);
    if (existing && !existing.revokedAt) {
      return NextResponse.json({ error: 'That email already has access or a pending invite.' }, { status: 409 });
    }

    if (existing?.revokedAt) {
      const restored = await AllowedEmail.update(existing.id, {
        role: payload.role,
        note: payload.note,
        revokedAt: null,
      });
      return NextResponse.json(restored);
    }

    const created = await AllowedEmail.create({
      ...payload,
      invitedByUserId: adminUserId,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to invite member.' }, { status: error.status || 400 });
  }
}
