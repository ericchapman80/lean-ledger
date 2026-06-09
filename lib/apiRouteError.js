import { NextResponse } from 'next/server';

export function apiRouteErrorResponse(error, fallbackMessage = 'Internal server error') {
  const status = Number(error?.status);

  if (Number.isInteger(status) && status >= 400 && status < 600) {
    return NextResponse.json(
      { error: error?.message || fallbackMessage },
      { status },
    );
  }

  console.error(error);
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
