import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin, slugify } from '@/lib/server/admin';
import { ensureDatabase, getD1, getProductById } from '@/lib/server/database';

const inputSchema = z.object({
  title: z.string().min(3).max(140).optional(),
  shortDescription: z.string().min(10).max(240).optional(),
  description: z.string().min(20).max(6000).optional(),
  category: z.string().min(2).max(80).optional(),
  priceVnd: z.number().int().min(0).max(1_000_000_000).optional(),
  licenseNote: z.string().min(3).max(500).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const { id } = await params;
  const productId = Number(id);
  const parsed = inputSchema.safeParse(await request.json());
  if (!Number.isInteger(productId) || !parsed.success) return NextResponse.json({ error: 'Dữ liệu cập nhật không hợp lệ.' }, { status: 400 });
  await ensureDatabase();
  const db = getD1();
  const current = await getProductById(productId);
  if (!current) return NextResponse.json({ error: 'Không tìm thấy sản phẩm.' }, { status: 404 });
  let categoryId: number | null = null;
  if (parsed.data.category) {
    const categorySlug = slugify(parsed.data.category);
    await db.prepare('INSERT OR IGNORE INTO categories (name, slug, sort_order) VALUES (?, ?, 0)').bind(parsed.data.category, categorySlug).run();
    categoryId = (await db.prepare('SELECT id FROM categories WHERE slug = ?').bind(categorySlug).first<{ id: number }>())?.id ?? null;
  }
  const next = parsed.data;
  await db.prepare(`UPDATE products SET title = ?, short_description = ?, description = ?, category_id = COALESCE(?, category_id), price_vnd = ?, license_note = ?, status = ?, updated_at = ?, published_at = CASE WHEN ? = 'published' THEN COALESCE(published_at, ?) ELSE published_at END WHERE id = ?`).bind(
    next.title ?? current.title,
    next.shortDescription ?? current.shortDescription,
    next.description ?? current.description,
    categoryId,
    next.priceVnd ?? current.priceVnd,
    next.licenseNote ?? current.licenseNote,
    next.status ?? current.status,
    Date.now(),
    next.status ?? current.status,
    Date.now(),
    productId,
  ).run();
  return NextResponse.json({ ok: true, product: await getProductById(productId) });
}
