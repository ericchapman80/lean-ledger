import { NextResponse } from 'next/server';
import { getAuthMode } from '@/lib/authConfig';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    authMode: getAuthMode(process.env),
  });
}
