import { NextRequest, NextResponse } from 'next/server';

import { ensureDatabase, getD1 } from '@/lib/server/database';
import {
  clearSessionCookie,
  cookieValue,
  hmac,
  SESSION_COOKIE,
} from '@/lib/server/security';
import {
  applySupabaseAuthState,
  createSupabaseAuthClient,
  createSupabaseAuthState,
} from '@/lib/server/supabase-auth';

export async function POST(request: NextRequest) {
  const token = cookieValue(request, SESSION_COOKIE);
  if (token) {
    await ensureDatabase();
    await getD1()
      .prepare('DELETE FROM sessions WHERE token_hash = ?')
      .bind(await hmac(token))
      .run();
  }

  const authState = createSupabaseAuthState();
  try {
    const supabase = createSupabaseAuthClient(request, authState);
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    // The internal session still needs to be cleared if Supabase is unavailable.
  }

  const response = applySupabaseAuthState(
    NextResponse.json({ ok: true }),
    authState,
  );
  response.headers.append('Set-Cookie', clearSessionCookie());
  return response;
}
