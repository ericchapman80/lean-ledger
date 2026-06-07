import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/accessControl';
import * as AllowedEmail from '@/lib/models/allowedEmail';
import * as User from '@/lib/models/user';

export async function PUT(request, { params }) {
  try {
    const adminUser = await requireAdminUser(request);
    const id = Number(params.id);
    const body = await request.json();

    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ error: 'Invalid member id.' }, { status: 400 });
    }

    const existing = await AllowedEmail.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Member invite not found.' }, { status: 404 });
    }

    if (existing.email === adminUser.email && body.role !== 'admin') {
      return NextResponse.json({ error: 'You cannot remove your own admin access.' }, { status: 400 });
    }

    const role = body.role === 'admin' ? 'admin' : 'member';
    const updated = await AllowedEmail.update(id, {
      role,
      note: body.note,
      revokedAt: body.revoke === true ? new Date().toISOString() : body.revoke === false ? null : undefined,
    });

    const linkedUser = await User.findByEmail(updated.email);
    if (linkedUser) {
      await User.updateRole(linkedUser.id, updated.role);
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to update member access.' }, { status: error.status || 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const adminUser = await requireAdminUser(request);
    const id = Number(params.id);

    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ error: 'Invalid member id.' }, { status: 400 });
    }

    const existing = await AllowedEmail.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Member invite not found.' }, { status: 404 });
    }

    if (existing.email === adminUser.email) {
      return NextResponse.json({ error: 'You cannot revoke your own access.' }, { status: 400 });
    }

    const revoked = await AllowedEmail.revoke(id);

    return NextResponse.json(revoked);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to revoke member access.' }, { status: error.status || 500 });
  }
}
