import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/server/security';

export async function requireAdmin(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return { user: null, response: NextResponse.json({ error: 'Bạn chưa đăng nhập.' }, { status: 401 }) };
  if (!user.isAdmin) return { user, response: NextResponse.json({ error: 'Tài khoản không có quyền quản trị.' }, { status: 403 }) };
  return { user, response: null };
}

export function slugify(value: string) {
  return value
    .trim()
    .toLocaleLowerCase('vi-VN')
    .replaceAll('đ', 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 100);
}
