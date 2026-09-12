import { ensureDatabase, getD1 } from '@/lib/server/database';
import { sendDownloadEmail } from '@/lib/server/email';
import { env } from '@/lib/server/env';
import { hmac, randomToken } from '@/lib/server/security';

type DeliveryItem = { id: number; title_snapshot: string };

export async function fulfillOrder(orderId: number, origin?: string, attemptKey = 'initial') {
  await ensureDatabase();
  const db = getD1();
  const order = await db.prepare('SELECT id, order_code, email, user_id, status FROM orders WHERE id = ?').bind(orderId).first<{ id: number; order_code: number; email: string; user_id: number | null; status: string }>();
  if (!order || order.status !== 'paid') throw new Error('Đơn hàng chưa sẵn sàng để giao.');
  const itemResult = await db.prepare('SELECT id, title_snapshot FROM order_items WHERE order_id = ? ORDER BY id').bind(orderId).all<DeliveryItem>();
  const now = Date.now();
  const baseOrigin = (env.APP_ORIGIN || origin || 'http://localhost:3000').replace(/\/$/, '');
  const links: Array<{ title: string; url: string }> = [];

  for (const item of itemResult.results) {
    await db.prepare('INSERT OR IGNORE INTO entitlements (order_item_id, user_id, email, created_at) VALUES (?, ?, ?, ?)').bind(item.id, order.user_id, order.email, now).run();
    const token = randomToken();
    const tokenHash = await hmac(token);
    await db.prepare('INSERT INTO download_links (order_item_id, token_hash, email, expires_at, max_downloads, download_count, created_at) VALUES (?, ?, ?, ?, 5, 0, ?)').bind(item.id, tokenHash, order.email, now + 7 * 24 * 60 * 60 * 1000, now).run();
    links.push({ title: item.title_snapshot, url: `${baseOrigin}/api/download/${token}` });
  }

  const delivery = await sendDownloadEmail(order.email, order.order_code, links, attemptKey);
  await db.prepare('UPDATE orders SET delivery_status = ?, delivery_error = ? WHERE id = ?').bind(delivery.ok ? 'sent' : 'failed', delivery.ok ? null : delivery.error, orderId).run();
  return { delivery, links };
}

export async function issueAccountDownload(orderItemId: number, userId: number) {
  await ensureDatabase();
  const row = await getD1().prepare(`
    SELECT oi.id, o.email FROM order_items oi
    JOIN entitlements e ON e.order_item_id = oi.id
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.id = ? AND (e.user_id = ? OR e.email = (SELECT email FROM users WHERE id = ?))
    LIMIT 1
  `).bind(orderItemId, userId, userId).first<{ id: number; email: string }>();
  if (!row) return null;
  const token = randomToken();
  const tokenHash = await hmac(token);
  const now = Date.now();
  await getD1().prepare('INSERT INTO download_links (order_item_id, token_hash, email, expires_at, max_downloads, download_count, created_at) VALUES (?, ?, ?, ?, 1, 0, ?)').bind(row.id, tokenHash, row.email, now + 5 * 60 * 1000, now).run();
  return token;
}
