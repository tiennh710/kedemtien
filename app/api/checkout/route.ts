import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { ensureDatabase, getD1 } from '@/lib/server/database';
import { fulfillOrder } from '@/lib/server/orders';
import { createPayOsLink } from '@/lib/server/payos';
import { getSessionUser, normalizeEmail } from '@/lib/server/security';

const inputSchema = z.object({ email: z.string().email().max(254), productIds: z.array(z.number().int().positive()).min(1).max(20) });

type CheckoutProduct = { id: number; title: string; price_vnd: number; asset_id: number | null };

export async function POST(request: Request) {
  try {
    const parsed = inputSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Giỏ hàng hoặc email không hợp lệ.' }, { status: 400 });
    const user = await getSessionUser(request);
    const email = user?.email ?? normalizeEmail(parsed.data.email);
    const productIds = [...new Set(parsed.data.productIds)];
    await ensureDatabase();
    const db = getD1();
    const placeholders = productIds.map(() => '?').join(',');
    const result = await db.prepare(`
      SELECT p.id, p.title, p.price_vnd,
        (SELECT pa.id FROM product_assets pa WHERE pa.product_id = p.id ORDER BY pa.version DESC LIMIT 1) AS asset_id
      FROM products p WHERE p.status = 'published' AND p.id IN (${placeholders})
    `).bind(...productIds).all<CheckoutProduct>();
    if (result.results.length !== productIds.length || result.results.some((product) => !product.asset_id)) return NextResponse.json({ error: 'Một sản phẩm không còn sẵn sàng. Vui lòng cập nhật giỏ hàng.' }, { status: 409 });
    const total = result.results.reduce((sum, product) => sum + product.price_vnd, 0);
    const now = Date.now();
    const orderCode = now * 100 + (crypto.getRandomValues(new Uint8Array(1))[0] % 100);
    const inserted = await db.prepare('INSERT INTO orders (order_code, email, user_id, status, amount_total, delivery_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(orderCode, email, user?.id ?? null, total === 0 ? 'paid' : 'pending', total, 'pending', now).run();
    const orderId = Number(inserted.meta.last_row_id);
    await db.batch(result.results.map((product) => db.prepare('INSERT INTO order_items (order_id, product_id, asset_id, title_snapshot, price_snapshot) VALUES (?, ?, ?, ?, ?)').bind(orderId, product.id, product.asset_id, product.title, product.price_vnd)));
    const origin = new URL(request.url).origin;
    if (total === 0) {
      const delivery = await fulfillOrder(orderId, origin);
      return NextResponse.json({ kind: 'free', orderCode, delivery: delivery.delivery.ok ? 'sent' : 'failed' });
    }
    const appOrigin = (env.APP_ORIGIN || origin).replace(/\/$/, '');
    const payment = await createPayOsLink({
      orderCode,
      amount: total,
      items: result.results.map((product) => ({ name: product.title.slice(0, 50), quantity: 1, price: product.price_vnd })),
      returnUrl: `${appOrigin}/thanh-toan/thanh-cong?orderCode=${orderCode}`,
      cancelUrl: `${appOrigin}/thanh-toan/huy?orderCode=${orderCode}`,
    });
    await db.prepare('UPDATE orders SET payos_payment_link_id = ? WHERE id = ?').bind(payment.paymentLinkId ?? null, orderId).run();
    return NextResponse.json({ kind: 'payos', orderCode, checkoutUrl: payment.checkoutUrl });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể tạo đơn hàng.' }, { status: 500 });
  }
}
