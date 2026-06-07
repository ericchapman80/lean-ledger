import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAuthMode } from '@/lib/authConfig';

export async function GET() {
  const mode = getAuthMode(process.env);
  const session = mode === 'enabled' ? await auth() : null;

  return NextResponse.json({
    mode,
    user: session?.user?.id ? {
      id: Number(session.user.id),
      email: session.user.email ?? null,
      name: session.user.name ?? null,
    } : null,
  });
}
