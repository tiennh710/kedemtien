import { NextResponse } from 'next/server';

import { ensureDatabase, getD1 } from '@/lib/server/database';
import { clearSessionCookie, cookieValue, hmac, SESSION_COOKIE } from '@/lib/server/security';

export async function POST(request: Request) {
  const token = cookieValue(request, SESSION_COOKIE);
  if (token) {
    await ensureDatabase();
    await getD1().prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await hmac(token)).run();
  }
  const response = NextResponse.json({ ok: true });
  response.headers.set('Set-Cookie', clearSessionCookie());
  return response;
}
