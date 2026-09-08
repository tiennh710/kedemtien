import { NextResponse } from 'next/server';
import { z } from 'zod';

import { issueAccountDownload } from '@/lib/server/orders';
import { getSessionUser } from '@/lib/server/security';

const inputSchema = z.object({ orderItemId: z.number().int().positive() });

export async function POST(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Bạn chưa đăng nhập.' }, { status: 401 });
  const parsed = inputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Yêu cầu tải không hợp lệ.' }, { status: 400 });
  const token = await issueAccountDownload(parsed.data.orderItemId, user.id);
  if (!token) return NextResponse.json({ error: 'Bạn không có quyền tải file này.' }, { status: 403 });
  return NextResponse.json({ url: `/api/download/${token}` });
}
