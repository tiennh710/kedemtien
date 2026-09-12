import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/server/admin';
import { ensureDatabase, getD1, getProductById } from '@/lib/server/database';

const inputSchema = z.object({
  path: z.string().min(1),
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1),
  size: z.number().int().positive().max(25 * 1024 * 1024),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  version: z.number().int().positive(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const productId = Number((await params).id);
  const parsed = inputSchema.safeParse(await request.json());
  if (!Number.isInteger(productId) || !parsed.success || !parsed.data.path.startsWith(`products/${productId}/`)) return NextResponse.json({ error: 'File XLSX không hợp lệ.' }, { status: 400 });
  await ensureDatabase();
  if (!await getProductById(productId)) return NextResponse.json({ error: 'Không tìm thấy sản phẩm.' }, { status: 404 });
  const asset = parsed.data;
  const expected = await getD1().prepare('SELECT COALESCE(MAX(version), 0) + 1 AS version FROM product_assets WHERE product_id = ?').bind(productId).first<{ version: number }>();
  if (asset.version !== (expected?.version ?? 1)) return NextResponse.json({ error: 'Phiên bản file đã thay đổi. Vui lòng thử lại.' }, { status: 409 });
  await getD1().prepare('INSERT INTO product_assets (product_id, version, r2_key, original_filename, content_type, size_bytes, sha256, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(productId, asset.version, asset.path, asset.filename, asset.contentType, asset.size, asset.sha256, Date.now()).run();
  return NextResponse.json({ ok: true, version: asset.version });
}
