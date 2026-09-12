import { NextRequest, NextResponse } from 'next/server';

import { env } from '@/lib/server/env';
import { safeReturnTo } from '@/lib/server/security';
import {
  applySupabaseAuthState,
  createSupabaseAuthClient,
  createSupabaseAuthState,
} from '@/lib/server/supabase-auth';

export async function GET(request: NextRequest) {
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get('returnTo'));

  try {
    const state = createSupabaseAuthState();
    const supabase = createSupabaseAuthClient(request, state);
    const origin = (env.APP_ORIGIN || request.nextUrl.origin).replace(
      /\/$/,
      '',
    );
    const callback = new URL('/api/auth/callback', origin);
    callback.searchParams.set('returnTo', returnTo);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callback.toString(),
        queryParams: { prompt: 'select_account' },
      },
    });

    if (error || !data.url)
      throw error ?? new Error('Không thể tạo liên kết đăng nhập Google.');
    return applySupabaseAuthState(NextResponse.redirect(data.url), state);
  } catch {
    const errorUrl = new URL('/dang-nhap', request.nextUrl.origin);
    errorUrl.searchParams.set('error', 'oauth_setup');
    errorUrl.searchParams.set('returnTo', returnTo);
    return NextResponse.redirect(errorUrl);
  }
}
