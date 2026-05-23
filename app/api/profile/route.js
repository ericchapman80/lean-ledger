import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import * as User from '@/lib/models/user';
import { enrichProfile, validateProfilePayload } from '@/lib/profile';

export async function GET(request) {
  const userId = await getCurrentUserId(request);
  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ error: 'Profile not found. Please complete setup.' }, { status: 404 });
  }
  return NextResponse.json(enrichProfile(user));
}

export async function POST(request) {
  const userId = await getCurrentUserId(request);
  const body = await request.json();

  const error = validateProfilePayload(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const existing = await User.findById(userId);
  const user = existing
    ? await User.update(userId, body)
    : await User.createWithId(userId, body);

  return NextResponse.json(enrichProfile(user));
}
