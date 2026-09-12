import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/server/admin';
import { ensureDatabase, getD1, getProductById } from '@/lib/server/database';
import { env } from '@/lib/server/env';
import { randomToken } from '@/lib/server/security';
import { ensureStorageBuckets, getStorageAdmin } from '@/lib/server/storage';

const excelType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const imageTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
const inputSchema = z.object({
  productId: z.number().int().positive(),
  kind: z.enum(['asset', 'image']),
  filename: z.string().min(1).max(255),
  contentType: z.string().max(100),
  size: z.number().int().positive(),
});

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const parsed = inputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Yêu cầu upload không hợp lệ.' }, { status: 400 });
  const input = parsed.data;
  await ensureDatabase();
  if (!await getProductById(input.productId)) return NextResponse.json({ error: 'Không tìm thấy sản phẩm.' }, { status: 404 });
  let bucket: string;
  let path: string;
  let version: number | undefined;
  if (input.kind === 'asset') {
    if (!input.filename.toLowerCase().endsWith('.xlsx') || input.size > 25 * 1024 * 1024) return NextResponse.json({ error: 'File XLSX không hợp lệ hoặc vượt quá 25 MB.' }, { status: 400 });
    const row = await getD1().prepare('SELECT COALESCE(MAX(version), 0) + 1 AS version FROM product_assets WHERE product_id = ?').bind(input.productId).first<{ version: number }>();
    version = row?.version ?? 1;
    bucket = env.PRODUCT_FILES_BUCKET;
    path = `products/${input.productId}/v${version}-${randomToken(12)}.xlsx`;
  } else {
    if (!imageTypes.has(input.contentType) || input.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Ảnh phải là PNG, JPG hoặc WebP và nhỏ hơn 5 MB.' }, { status: 400 });
    const extension = input.contentType === 'image/png' ? 'png' : input.contentType === 'image/webp' ? 'webp' : 'jpg';
    bucket = env.PRODUCT_IMAGES_BUCKET;
    path = `products/${input.productId}/images/${randomToken(12)}.${extension}`;
  }
  await ensureStorageBuckets();
  const { data, error } = await getStorageAdmin().storage.from(bucket).createSignedUploadUrl(path);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bucket, path, token: data.token, version, contentType: input.kind === 'asset' ? excelType : input.contentType });
}
