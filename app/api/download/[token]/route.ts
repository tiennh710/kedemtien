import { ensureDatabase, getD1, getFilesBucket } from '@/lib/server/database';
import { hmac, requestFingerprint } from '@/lib/server/security';

type DownloadRow = {
  id: number;
  expires_at: number;
  max_downloads: number;
  download_count: number;
  r2_key: string;
  original_filename: string;
  content_type: string;
};

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token || token.length < 20) return new Response('Link tải không hợp lệ.', { status: 404 });
  await ensureDatabase();
  const tokenHash = await hmac(token);
  const db = getD1();
  const row = await db.prepare(`
    SELECT dl.id, dl.expires_at, dl.max_downloads, dl.download_count,
      pa.r2_key, pa.original_filename, pa.content_type
    FROM download_links dl
    JOIN order_items oi ON oi.id = dl.order_item_id
    JOIN product_assets pa ON pa.id = oi.asset_id
    WHERE dl.token_hash = ? LIMIT 1
  `).bind(tokenHash).first<DownloadRow>();
  if (!row || row.expires_at < Date.now() || row.download_count >= row.max_downloads) return new Response('Link đã hết hạn hoặc hết lượt tải.', { status: 410 });
  const updated = await db.prepare('UPDATE download_links SET download_count = download_count + 1 WHERE id = ? AND download_count < max_downloads AND expires_at > ?').bind(row.id, Date.now()).run();
  if (!updated.meta.changes) return new Response('Link đã hết lượt tải.', { status: 410 });
  const ipHash = await requestFingerprint(request);
  await db.prepare('INSERT INTO download_events (link_id, ip_hash, user_agent, created_at) VALUES (?, ?, ?, ?)').bind(row.id, ipHash, request.headers.get('user-agent') ?? '', Date.now()).run();
  const filename = row.original_filename.replace(/[\r\n"\\/]/g, '_');
  try {
    return Response.redirect(await getFilesBucket().createSignedUrl(row.r2_key, 60, filename), 302);
  } catch {
    return new Response('File hiện không khả dụng.', { status: 404 });
  }
}
