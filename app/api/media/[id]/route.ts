import { ensureDatabase, getD1, getFilesBucket } from '@/lib/server/database';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const imageId = Number(id);
  if (!Number.isInteger(imageId) || imageId < 1) return new Response('Không tìm thấy ảnh.', { status: 404 });
  await ensureDatabase();
  const row = await getD1().prepare('SELECT r2_key, content_type FROM product_images WHERE id = ?').bind(imageId).first<{ r2_key: string; content_type: string }>();
  if (!row) return new Response('Không tìm thấy ảnh.', { status: 404 });
  try {
    return Response.redirect(await getFilesBucket().createSignedUrl(row.r2_key, 60 * 60), 302);
  } catch {
    return new Response('Không tìm thấy ảnh.', { status: 404 });
  }
}
