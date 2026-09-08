import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/server/admin';
import { ensureDatabase, getD1 } from '@/lib/server/database';
import { fulfillOrder } from '@/lib/server/orders';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const orderId = Number((await params).id);
  if (!Number.isInteger(orderId)) return NextResponse.json({ error: 'Mã đơn không hợp lệ.' }, { status: 400 });
  await ensureDatabase();
  await getD1().prepare("UPDATE orders SET delivery_status = 'pending', delivery_error = NULL WHERE id = ? AND status = 'paid'").bind(orderId).run();
  const result = await fulfillOrder(orderId, new URL(request.url).origin, `resend-${Date.now()}`);
  return NextResponse.json({ ok: result.delivery.ok, delivery: result.delivery });
}
