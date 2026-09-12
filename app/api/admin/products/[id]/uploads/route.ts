import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/server/admin';
import { ensureDatabase, getD1, getProductById } from '@/lib/server/database';
import { env } from '@/lib/server/env';

const assetSchema = z.object({ path: z.string().min(1), filename: z.string().min(1).max(255), contentType: z.string().min(1), size: z.number().int().positive().max(25 * 1024 * 1024), sha256: z.string().regex(/^[a-f0-9]{64}$/), version: z.number().int().positive() });
const imageSchema = z.object({ path: z.string().min(1), contentType: z.enum(['image/png', 'image/jpeg', 'image/webp']), size: z.number().int().positive().max(5 * 1024 * 1024), altText: z.string().min(1).max(300), sortOrder: z.number().int().min(0).max(5) });
const inputSchema = z.object({ asset: assetSchema, images: z.array(imageSchema).min(1).max(6) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const productId = Number((await params).id);
  const parsed = inputSchema.safeParse(await request.json());
  if (!Number.isInteger(productId) || !parsed.success) return NextResponse.json({ error: 'Metadata upload không hợp lệ.' }, { status: 400 });
  const prefix = `products/${productId}/`;
  if (!parsed.data.asset.path.startsWith(prefix) || parsed.data.images.some((image) => !image.path.startsWith(`${prefix}images/`))) return NextResponse.json({ error: 'Đường dẫn lưu trữ không hợp lệ.' }, { status: 400 });
  await ensureDatabase();
  const product = await getProductById(productId);
  if (!product) return NextResponse.json({ error: 'Không tìm thấy sản phẩm.' }, { status: 404 });
  const existing = await getD1().prepare('SELECT id FROM product_assets WHERE product_id = ? LIMIT 1').bind(productId).first();
  if (existing) return NextResponse.json({ error: 'Sản phẩm đã có file. Hãy dùng chức năng thay file.' }, { status: 409 });
  const db = getD1();
  const now = Date.now();
  const asset = parsed.data.asset;
  await db.prepare('INSERT INTO product_assets (product_id, version, r2_key, original_filename, content_type, size_bytes, sha256, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(productId, asset.version, asset.path, asset.filename, asset.contentType, asset.size, asset.sha256, now).run();
  await db.batch(parsed.data.images.map((image) => db.prepare('INSERT INTO product_images (product_id, r2_key, content_type, alt_text, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(productId, image.path, image.contentType, image.altText, image.sortOrder, now)));
  return NextResponse.json({ ok: true, product: await getProductById(productId), buckets: { files: env.PRODUCT_FILES_BUCKET, images: env.PRODUCT_IMAGES_BUCKET } });
}
