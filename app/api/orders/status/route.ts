import { NextResponse } from 'next/server';

import { ensureDatabase, getD1 } from '@/lib/server/database';

export async function GET(request: Request) {
  const orderCode = Number(new URL(request.url).searchParams.get('orderCode'));
  if (!Number.isSafeInteger(orderCode)) return NextResponse.json({ error: 'Mã đơn không hợp lệ.' }, { status: 400 });
  await ensureDatabase();
  const order = await getD1().prepare('SELECT order_code, status, amount_total, delivery_status, paid_at FROM orders WHERE order_code = ?').bind(orderCode).first();
  if (!order) return NextResponse.json({ error: 'Không tìm thấy đơn.' }, { status: 404 });
  return NextResponse.json({ order });
}
