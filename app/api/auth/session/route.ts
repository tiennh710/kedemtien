import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/server/security';

export async function GET(request: Request) {
  const user = await getSessionUser(request);
  return NextResponse.json({ user });
}
