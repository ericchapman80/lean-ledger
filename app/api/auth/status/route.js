import { NextResponse } from 'next/server';
import * as User from '@/lib/models/user';
import { auth } from '@/auth';
import { getAuthMode } from '@/lib/authConfig';

export async function GET() {
  const mode = getAuthMode(process.env);
  const session = mode === 'enabled' ? await auth() : null;
  const appUser = session?.user?.id ? await User.findById(Number(session.user.id)) : null;

  return NextResponse.json({
    mode,
    user: session?.user?.id ? {
      id: Number(session.user.id),
      email: session.user.email ?? null,
      name: session.user.name ?? null,
      role: appUser?.role ?? 'member',
    } : null,
  });
}
