import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';

import { env } from '@/lib/server/env';

type CookieToSet = { name: string; value: string; options: CookieOptions };

export type SupabaseAuthState = {
  cookies: CookieToSet[];
  headers: Record<string, string>;
};

export function createSupabaseAuthState(): SupabaseAuthState {
  return { cookies: [], headers: {} };
}

export function createSupabaseAuthClient(
  request: NextRequest,
  state: SupabaseAuthState,
) {
  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) {
    throw new Error('Supabase Auth chưa được cấu hình.');
  }

  return createServerClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies, headers) => {
        state.cookies.push(...cookies);
        Object.assign(state.headers, headers);
      },
    },
  });
}

export function applySupabaseAuthState(
  response: NextResponse,
  state: SupabaseAuthState,
) {
  for (const { name, value, options } of state.cookies) {
    response.cookies.set(name, value, options);
  }
  for (const [name, value] of Object.entries(state.headers)) {
    response.headers.set(name, value);
  }
  return response;
}
