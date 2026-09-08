import { NextResponse } from 'next/server';

import { listProducts, ensureDatabase, getD1, getFilesBucket } from '@/lib/server/database';
import { requireAdmin, slugify } from '@/lib/server/admin';
import { randomToken, sha256 } from '@/lib/server/security';

const MAX_EXCEL_SIZE = 25 * 1024 * 1024;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const imageTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
const excelType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  return NextResponse.json({ products: await listProducts({ includeUnpublished: true }) });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const storedKeys: string[] = [];
  try {
    const form = await request.formData();
    const title = textField(form, 'title', 3, 140);
    const shortDescription = textField(form, 'shortDescription', 10, 240);
    const description = textField(form, 'description', 20, 6000);
    const category = textField(form, 'category', 2, 80);
    const licenseNote = textField(form, 'licenseNote', 3, 500);
    const priceVnd = Number(form.get('priceVnd'));
    const status = form.get('status') === 'published' ? 'published' : 'draft';
    if (!Number.isSafeInteger(priceVnd) || priceVnd < 0 || priceVnd > 1_000_000_000) throw new Error('Giá sản phẩm không hợp lệ.');
    const file = form.get('file');
    if (!(file instanceof File)) throw new Error('Vui lòng chọn file .xlsx.');
    await validateExcel(file);
    const images = form.getAll('images').filter((item): item is File => item instanceof File && item.size > 0);
    if (!images.length || images.length > 6) throw new Error('Sản phẩm cần 1 đến 6 ảnh preview.');
    for (const image of images) validateImage(image);

    await ensureDatabase();
    const db = getD1();
    const categorySlug = slugify(category);
    await db.prepare('INSERT OR IGNORE INTO categories (name, slug, sort_order) VALUES (?, ?, 0)').bind(category, categorySlug).run();
    const categoryRow = await db.prepare('SELECT id FROM categories WHERE slug = ?').bind(categorySlug).first<{ id: number }>();
    if (!categoryRow) throw new Error('Không thể tạo danh mục.');
    const baseSlug = slugify(String(form.get('slug') || title));
    if (!baseSlug) throw new Error('Đường dẫn sản phẩm không hợp lệ.');
    const duplicate = await db.prepare('SELECT id FROM products WHERE slug = ?').bind(baseSlug).first();
    if (duplicate) return NextResponse.json({ error: 'Đường dẫn sản phẩm đã tồn tại.' }, { status: 409 });

    const now = Date.now();
    const inserted = await db.prepare(`INSERT INTO products (category_id, slug, title, short_description, description, price_vnd, license_note, status, cover_tone, created_at, updated_at, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'indigo', ?, ?, ?)`).bind(categoryRow.id, baseSlug, title, shortDescription, description, priceVnd, licenseNote, status, now, now, status === 'published' ? now : null).run();
    const productId = Number(inserted.meta.last_row_id);
    const fileBuffer = await file.arrayBuffer();
    const fileKey = `products/${productId}/v1-${randomToken(12)}.xlsx`;
    await getFilesBucket().put(fileKey, fileBuffer, { httpMetadata: { contentType: excelType } });
    storedKeys.push(fileKey);
    await db.prepare('INSERT INTO product_assets (product_id, version, r2_key, original_filename, content_type, size_bytes, sha256, created_at) VALUES (?, 1, ?, ?, ?, ?, ?, ?)').bind(productId, fileKey, file.name, excelType, file.size, await sha256(fileBuffer), now).run();

    for (const [index, image] of images.entries()) {
      const extension = image.type === 'image/png' ? 'png' : image.type === 'image/webp' ? 'webp' : 'jpg';
      const key = `products/${productId}/images/${index}-${randomToken(10)}.${extension}`;
      await getFilesBucket().put(key, await image.arrayBuffer(), { httpMetadata: { contentType: image.type } });
      storedKeys.push(key);
      await db.prepare('INSERT INTO product_images (product_id, r2_key, content_type, alt_text, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(productId, key, image.type, `${title} — ảnh ${index + 1}`, index, now).run();
    }
    return NextResponse.json({ ok: true, product: await import('@/lib/server/database').then((module) => module.getProductById(productId)) }, { status: 201 });
  } catch (error) {
    await Promise.all(storedKeys.map((key) => getFilesBucket().delete(key).catch(() => undefined)));
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể tạo sản phẩm.' }, { status: 400 });
  }
}

function textField(form: FormData, key: string, min: number, max: number) {
  const value = String(form.get(key) ?? '').trim();
  if (value.length < min || value.length > max) throw new Error(`${key} chưa hợp lệ.`);
  return value;
}

async function validateExcel(file: File) {
  if (!file.name.toLocaleLowerCase('en-US').endsWith('.xlsx')) throw new Error('Chỉ chấp nhận file .xlsx.');
  if (file.size < 4 || file.size > MAX_EXCEL_SIZE) throw new Error('File Excel phải nhỏ hơn 25 MB.');
  const signature = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  if (signature[0] !== 0x50 || signature[1] !== 0x4b || signature[2] !== 0x03 || signature[3] !== 0x04) throw new Error('File không có cấu trúc XLSX hợp lệ.');
}

function validateImage(file: File) {
  if (!imageTypes.has(file.type) || file.size > MAX_IMAGE_SIZE) throw new Error('Ảnh phải là PNG, JPG hoặc WebP và nhỏ hơn 5 MB.');
}
