import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/server/admin';
import { ensureDatabase, getD1 } from '@/lib/server/database';

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  await ensureDatabase();
  const result = await getD1().prepare(`
    SELECT o.id, o.order_code, o.email, o.status, o.amount_total, o.delivery_status, o.delivery_error, o.created_at, o.paid_at,
      GROUP_CONCAT(oi.title_snapshot, ' • ') AS items
    FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
    GROUP BY o.id ORDER BY o.created_at DESC LIMIT 200
  `).all();
  return NextResponse.json({ orders: result.results });
}
