import { env } from 'cloudflare:workers';

import { demoProducts, type CatalogProduct, type ProductStatus } from '@/lib/catalog';

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, sort_order INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, category_id INTEGER REFERENCES categories(id), slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, short_description TEXT NOT NULL, description TEXT NOT NULL, price_vnd INTEGER NOT NULL DEFAULT 0, license_note TEXT NOT NULL DEFAULT 'Giấy phép sử dụng tiêu chuẩn', status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')), cover_tone TEXT NOT NULL DEFAULT 'indigo', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, published_at INTEGER)`,
  `CREATE TABLE IF NOT EXISTS product_assets (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL REFERENCES products(id), version INTEGER NOT NULL, r2_key TEXT NOT NULL UNIQUE, original_filename TEXT NOT NULL, content_type TEXT NOT NULL, size_bytes INTEGER NOT NULL, sha256 TEXT NOT NULL, created_at INTEGER NOT NULL, UNIQUE(product_id, version))`,
  `CREATE TABLE IF NOT EXISTS product_images (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL REFERENCES products(id), r2_key TEXT NOT NULL UNIQUE, content_type TEXT NOT NULL, alt_text TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS otp_challenges (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL, code_hash TEXT NOT NULL, ip_hash TEXT NOT NULL, expires_at INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, consumed_at INTEGER, created_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id), token_hash TEXT NOT NULL UNIQUE, expires_at INTEGER NOT NULL, last_seen_at INTEGER NOT NULL, created_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, order_code INTEGER NOT NULL UNIQUE, email TEXT NOT NULL, user_id INTEGER REFERENCES users(id), status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','cancelled','expired','refunded')), amount_total INTEGER NOT NULL, payos_payment_link_id TEXT, delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK(delivery_status IN ('pending','sent','failed')), delivery_error TEXT, created_at INTEGER NOT NULL, paid_at INTEGER)`,
  `CREATE TABLE IF NOT EXISTS order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL REFERENCES orders(id), product_id INTEGER NOT NULL REFERENCES products(id), asset_id INTEGER NOT NULL REFERENCES product_assets(id), title_snapshot TEXT NOT NULL, price_snapshot INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS entitlements (id INTEGER PRIMARY KEY AUTOINCREMENT, order_item_id INTEGER NOT NULL UNIQUE REFERENCES order_items(id), user_id INTEGER REFERENCES users(id), email TEXT NOT NULL, created_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS download_links (id INTEGER PRIMARY KEY AUTOINCREMENT, order_item_id INTEGER NOT NULL REFERENCES order_items(id), token_hash TEXT NOT NULL UNIQUE, email TEXT NOT NULL, expires_at INTEGER NOT NULL, max_downloads INTEGER NOT NULL DEFAULT 5, download_count INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS download_events (id INTEGER PRIMARY KEY AUTOINCREMENT, link_id INTEGER NOT NULL REFERENCES download_links(id), ip_hash TEXT NOT NULL, user_agent TEXT NOT NULL, created_at INTEGER NOT NULL)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products(slug)`,
  `CREATE INDEX IF NOT EXISTS idx_products_status_category ON products(status, category_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_product_assets_version ON product_assets(product_id, version)`,
  `CREATE INDEX IF NOT EXISTS idx_product_images_product_sort ON product_images(product_id, sort_order)`,
  `CREATE INDEX IF NOT EXISTS idx_otp_email_created ON otp_challenges(email, created_at)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_email_created ON orders(email, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)`,
  `CREATE INDEX IF NOT EXISTS idx_entitlements_email ON entitlements(email)`,
  `CREATE INDEX IF NOT EXISTS idx_entitlements_user ON entitlements(user_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_download_links_token ON download_links(token_hash)`,
  `CREATE INDEX IF NOT EXISTS idx_download_events_link ON download_events(link_id)`,
];

let ready: Promise<void> | undefined;

export function getD1() {
  if (!env.DB) throw new Error('D1 binding DB chưa được cấu hình.');
  return env.DB;
}

export function getFilesBucket() {
  if (!env.FILES) throw new Error('R2 binding FILES chưa được cấu hình.');
  return env.FILES;
}

export async function ensureDatabase() {
  ready ??= (async () => {
    const db = getD1();
    const statements = schemaStatements.map((sql) => db.prepare(sql));
    await db.batch(statements);
    await db.prepare('PRAGMA optimize').run();
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
