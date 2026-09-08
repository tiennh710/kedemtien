import { NextResponse } from 'next/server';

import { ensureDatabase, getD1 } from '@/lib/server/database';
import { getSessionUser } from '@/lib/server/security';

export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Bạn chưa đăng nhập.' }, { status: 401 });
  await ensureDatabase();
  const result = await getD1().prepare(`
    SELECT oi.id AS order_item_id, oi.title_snapshot, oi.price_snapshot,
      o.order_code, o.paid_at, pa.original_filename, pa.size_bytes, pa.version
    FROM entitlements e
    JOIN order_items oi ON oi.id = e.order_item_id
    JOIN orders o ON o.id = oi.order_id
    JOIN product_assets pa ON pa.id = oi.asset_id
    WHERE e.user_id = ? OR e.email = ?
    ORDER BY o.paid_at DESC, oi.id DESC
  `).bind(user.id, user.email).all();
  return NextResponse.json({ user, items: result.results });
}
