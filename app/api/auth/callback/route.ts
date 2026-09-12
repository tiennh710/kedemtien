import { NextRequest, NextResponse } from 'next/server';

import {
  createUserSession,
  safeReturnTo,
  sessionCookie,
} from '@/lib/server/security';
import {
  applySupabaseAuthState,
  createSupabaseAuthClient,
  createSupabaseAuthState,
} from '@/lib/server/supabase-auth';

function loginErrorUrl(request: NextRequest, returnTo: string) {
  const url = new URL('/dang-nhap', request.nextUrl.origin);
  url.searchParams.set('error', 'oauth_failed');
  url.searchParams.set('returnTo', returnTo);
  return url;
}

export async function GET(request: NextRequest) {
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get('returnTo'));
  const code = request.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.redirect(loginErrorUrl(request, returnTo));

  try {
    const state = createSupabaseAuthState();
    const supabase = createSupabaseAuthClient(request, state);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    const email = data.user?.email;
    if (error || !email)
      throw error ?? new Error('Google không trả về địa chỉ email.');

    const token = await createUserSession(email);
    const destination = new URL(returnTo, request.nextUrl.origin);
    const response = applySupabaseAuthState(
      NextResponse.redirect(destination),
      state,
    );
    response.headers.append('Set-Cookie', sessionCookie(token));
    return response;
  } catch {
    return NextResponse.redirect(loginErrorUrl(request, returnTo));
  }
}
