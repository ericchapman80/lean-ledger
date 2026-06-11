import { NextResponse } from 'next/server';
import { searchFoodDatabase } from '@/lib/foodSearch';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters' },
      { status: 400 },
    );
  }

  const result = await searchFoodDatabase(q);

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
  });
}
