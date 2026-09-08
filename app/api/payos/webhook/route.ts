import { NextResponse } from 'next/server';

import { ensureDatabase, getD1 } from '@/lib/server/database';
import { fulfillOrder } from '@/lib/server/orders';
import { verifyPayOsWebhook } from '@/lib/server/payos';

export async function POST(request: Request) {
  try {
    const verified = await verifyPayOsWebhook(await request.json());
    if (!verified) return NextResponse.json({ error: 'Chữ ký webhook không hợp lệ.' }, { status: 400 });
    const orderCode = Number(verified.orderCode);
    const amount = Number(verified.amount);
    await ensureDatabase();
    const order = await getD1().prepare('SELECT id, status, amount_total FROM orders WHERE order_code = ?').bind(orderCode).first<{ id: number; status: string; amount_total: number }>();
    if (!order) return NextResponse.json({ ok: true, sample: true });
    if (order.amount_total !== amount) return NextResponse.json({ error: 'Số tiền webhook không khớp đơn hàng.' }, { status: 400 });
    if (order.status === 'paid') return NextResponse.json({ ok: true, duplicate: true });
    if (verified.code !== '00' || verified.success === false) return NextResponse.json({ ok: true, ignored: true });
    await getD1().prepare("UPDATE orders SET status = 'paid', paid_at = ? WHERE id = ? AND status = 'pending'").bind(Date.now(), order.id).run();
    await fulfillOrder(order.id, new URL(request.url).origin);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể xử lý webhook.' }, { status: 500 });
  }
}
