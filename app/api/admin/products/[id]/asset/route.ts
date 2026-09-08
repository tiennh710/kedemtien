import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/server/admin';
import { ensureDatabase, getD1, getFilesBucket, getProductById } from '@/lib/server/database';
import { randomToken, sha256 } from '@/lib/server/security';

const excelType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const productId = Number((await params).id);
  const form = await request.formData();
  const file = form.get('file');
  if (!Number.isInteger(productId) || !(file instanceof File) || !file.name.toLowerCase().endsWith('.xlsx') || file.size > 25 * 1024 * 1024) return NextResponse.json({ error: 'File .xlsx không hợp lệ hoặc vượt quá 25 MB.' }, { status: 400 });
  const signature = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  if (signature[0] !== 0x50 || signature[1] !== 0x4b || signature[2] !== 0x03 || signature[3] !== 0x04) return NextResponse.json({ error: 'File không có cấu trúc XLSX hợp lệ.' }, { status: 400 });
  await ensureDatabase();
  const product = await getProductById(productId);
  if (!product) return NextResponse.json({ error: 'Không tìm thấy sản phẩm.' }, { status: 404 });
  const versionRow = await getD1().prepare('SELECT COALESCE(MAX(version), 0) + 1 AS version FROM product_assets WHERE product_id = ?').bind(productId).first<{ version: number }>();
  const version = versionRow?.version ?? 1;
  const key = `products/${productId}/v${version}-${randomToken(12)}.xlsx`;
  const buffer = await file.arrayBuffer();
  await getFilesBucket().put(key, buffer, { httpMetadata: { contentType: excelType } });
  try {
    await getD1().prepare('INSERT INTO product_assets (product_id, version, r2_key, original_filename, content_type, size_bytes, sha256, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(productId, version, key, file.name, excelType, file.size, await sha256(buffer), Date.now()).run();
  } catch (error) {
    await getFilesBucket().delete(key);
    throw error;
  }
  return NextResponse.json({ ok: true, version });
}
