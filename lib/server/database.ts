import { demoProducts, type CatalogProduct, type ProductStatus } from '@/lib/catalog';
import { getDatabaseCompat, schemaStatements } from '@/lib/server/postgres';
import { getFilesBucket } from '@/lib/server/storage';

let ready: Promise<void> | undefined;

export function getD1() {
  return getDatabaseCompat();
}

export { getFilesBucket };

export async function ensureDatabase() {
  ready ??= (async () => {
    const db = getD1();
    const statements = schemaStatements.map((sql) => db.prepare(sql));
    await db.batch(statements);
  })().catch((error) => {
    ready = undefined;
    throw error;
  });
  await ready;
}

type ProductRow = {
  id: number;
  slug: string;
  title: string;
  short_description: string;
  description: string;
  category: string | null;
  category_slug: string | null;
  price_vnd: number;
  license_note: string;
  status: ProductStatus;
  cover_tone: string;
  cover_image_id: number | null;
  asset_id: number | null;
  version: number | null;
  original_filename: string | null;
  size_bytes: number | null;
};

function mapProduct(row: ProductRow, galleryIds: number[] = []): CatalogProduct {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description,
    description: row.description,
    category: row.category ?? 'Khác',
    categorySlug: row.category_slug ?? 'khac',
    priceVnd: row.price_vnd,
    licenseNote: row.license_note,
    status: row.status,
    coverTone: row.cover_tone,
    coverUrl: row.cover_image_id ? `/api/media/${row.cover_image_id}` : null,
    galleryUrls: galleryIds.map((id) => `/api/media/${id}`),
    assetId: row.asset_id,
    version: row.version,
    filename: row.original_filename,
    sizeBytes: row.size_bytes,
  };
}

const productSelect = `
  SELECT p.id, p.slug, p.title, p.short_description, p.description,
    c.name AS category, c.slug AS category_slug, p.price_vnd, p.license_note,
    p.status, p.cover_tone,
    (SELECT pi.id FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1) AS cover_image_id,
    (SELECT pa.id FROM product_assets pa WHERE pa.product_id = p.id ORDER BY pa.version DESC LIMIT 1) AS asset_id,
    (SELECT pa.version FROM product_assets pa WHERE pa.product_id = p.id ORDER BY pa.version DESC LIMIT 1) AS version,
    (SELECT pa.original_filename FROM product_assets pa WHERE pa.product_id = p.id ORDER BY pa.version DESC LIMIT 1) AS original_filename,
    (SELECT pa.size_bytes FROM product_assets pa WHERE pa.product_id = p.id ORDER BY pa.version DESC LIMIT 1) AS size_bytes
  FROM products p LEFT JOIN categories c ON c.id = p.category_id`;

export async function listProducts(options: { includeUnpublished?: boolean } = {}) {
  await ensureDatabase();
  const where = options.includeUnpublished ? '' : " WHERE p.status = 'published'";
  const result = await getD1().prepare(`${productSelect}${where} ORDER BY COALESCE(p.published_at, p.created_at) DESC`).all<ProductRow>();
  const products = result.results.map((row) => mapProduct(row));
  return products.length || options.includeUnpublished ? products : demoProducts;
}

export async function getProductBySlug(slug: string) {
  await ensureDatabase();
  const row = await getD1().prepare(`${productSelect} WHERE p.slug = ? AND p.status = 'published' LIMIT 1`).bind(slug).first<ProductRow>();
  if (!row) return demoProducts.find((product) => product.slug === slug) ?? null;
  const images = await getD1().prepare('SELECT id FROM product_images WHERE product_id = ? ORDER BY sort_order, id').bind(row.id).all<{ id: number }>();
  return mapProduct(row, images.results.map((image) => image.id));
}

export async function getProductById(id: number) {
  await ensureDatabase();
  const row = await getD1().prepare(`${productSelect} WHERE p.id = ? LIMIT 1`).bind(id).first<ProductRow>();
  return row ? mapProduct(row) : null;
}

export async function listCategories() {
  await ensureDatabase();
  const result = await getD1().prepare('SELECT id, name, slug FROM categories ORDER BY sort_order, name').all<{ id: number; name: string; slug: string }>();
  return result.results;
}
