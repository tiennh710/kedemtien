import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin, slugify } from '@/lib/server/admin';
import { ensureDatabase, getD1, getProductById, listProducts } from '@/lib/server/database';

const inputSchema = z.object({
  title: z.string().min(3).max(140),
  slug: z.string().max(100).optional(),
  shortDescription: z.string().min(10).max(240),
  description: z.string().min(20).max(6000),
  category: z.string().min(2).max(80),
  licenseNote: z.string().min(3).max(500),
  priceVnd: z.number().int().min(0).max(1_000_000_000),
  status: z.enum(['draft', 'published']).default('draft'),
});

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  return NextResponse.json({ products: await listProducts({ includeUnpublished: true }) });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  try {
    const parsed = inputSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Thông tin sản phẩm chưa hợp lệ.' }, { status: 400 });
    await ensureDatabase();
    const db = getD1();
    const categorySlug = slugify(parsed.data.category);
    await db.prepare('INSERT OR IGNORE INTO categories (name, slug, sort_order) VALUES (?, ?, 0)').bind(parsed.data.category, categorySlug).run();
    const category = await db.prepare('SELECT id FROM categories WHERE slug = ?').bind(categorySlug).first<{ id: number }>();
    if (!category) throw new Error('Không thể tạo danh mục.');
    const productSlug = slugify(parsed.data.slug || parsed.data.title);
    if (!productSlug) return NextResponse.json({ error: 'Đường dẫn sản phẩm không hợp lệ.' }, { status: 400 });
    const duplicate = await db.prepare('SELECT id FROM products WHERE slug = ?').bind(productSlug).first();
    if (duplicate) return NextResponse.json({ error: 'Đường dẫn sản phẩm đã tồn tại.' }, { status: 409 });
    const now = Date.now();
    const inserted = await db.prepare(`INSERT INTO products (category_id, slug, title, short_description, description, price_vnd, license_note, status, cover_tone, created_at, updated_at, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'indigo', ?, ?, ?)`).bind(category.id, productSlug, parsed.data.title, parsed.data.shortDescription, parsed.data.description, parsed.data.priceVnd, parsed.data.licenseNote, parsed.data.status, now, now, parsed.data.status === 'published' ? now : null).run();
    const productId = inserted.meta.last_row_id;
    if (!productId) throw new Error('Không thể tạo sản phẩm.');
    return NextResponse.json({ ok: true, productId, product: await getProductById(productId) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể tạo sản phẩm.' }, { status: 400 });
  }
}
