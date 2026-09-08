import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const categories = sqliteTable(
  'categories',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [uniqueIndex('idx_categories_slug').on(table.slug)],
);

export const products = sqliteTable(
  'products',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    categoryId: integer('category_id').references(() => categories.id),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    shortDescription: text('short_description').notNull(),
    description: text('description').notNull(),
    priceVnd: integer('price_vnd').notNull().default(0),
    licenseNote: text('license_note').notNull().default('Giấy phép sử dụng tiêu chuẩn'),
    status: text('status', { enum: ['draft', 'published', 'archived'] }).notNull().default('draft'),
    coverTone: text('cover_tone').notNull().default('indigo'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
    publishedAt: integer('published_at'),
  },
  (table) => [
    uniqueIndex('idx_products_slug').on(table.slug),
    index('idx_products_status_category').on(table.status, table.categoryId),
  ],
);

export const productAssets = sqliteTable(
  'product_assets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    productId: integer('product_id').notNull().references(() => products.id),
    version: integer('version').notNull(),
    r2Key: text('r2_key').notNull(),
    originalFilename: text('original_filename').notNull(),
    contentType: text('content_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    sha256: text('sha256').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_product_assets_key').on(table.r2Key),
    uniqueIndex('idx_product_assets_version').on(table.productId, table.version),
  ],
);

export const productImages = sqliteTable(
  'product_images',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    productId: integer('product_id').notNull().references(() => products.id),
    r2Key: text('r2_key').notNull(),
    contentType: text('content_type').notNull(),
    altText: text('alt_text').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_product_images_key').on(table.r2Key),
    index('idx_product_images_product_sort').on(table.productId, table.sortOrder),
  ],
);

export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    email: text('email').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [uniqueIndex('idx_users_email').on(table.email)],
);

export const otpChallenges = sqliteTable(
  'otp_challenges',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    email: text('email').notNull(),
    codeHash: text('code_hash').notNull(),
    ipHash: text('ip_hash').notNull(),
    expiresAt: integer('expires_at').notNull(),
    attempts: integer('attempts').notNull().default(0),
    consumedAt: integer('consumed_at'),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [index('idx_otp_email_created').on(table.email, table.createdAt)],
);

export const sessions = sqliteTable(
  'sessions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull().references(() => users.id),
    tokenHash: text('token_hash').notNull(),
    expiresAt: integer('expires_at').notNull(),
    lastSeenAt: integer('last_seen_at').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_sessions_token').on(table.tokenHash),
    index('idx_sessions_user').on(table.userId),
  ],
);

export const orders = sqliteTable(
  'orders',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    orderCode: integer('order_code').notNull(),
    email: text('email').notNull(),
    userId: integer('user_id').references(() => users.id),
    status: text('status', { enum: ['pending', 'paid', 'cancelled', 'expired', 'refunded'] }).notNull().default('pending'),
    amountTotal: integer('amount_total').notNull(),
    payosPaymentLinkId: text('payos_payment_link_id'),
    deliveryStatus: text('delivery_status', { enum: ['pending', 'sent', 'failed'] }).notNull().default('pending'),
    deliveryError: text('delivery_error'),
    createdAt: integer('created_at').notNull(),
    paidAt: integer('paid_at'),
  },
  (table) => [
    uniqueIndex('idx_orders_order_code').on(table.orderCode),
    index('idx_orders_email_created').on(table.email, table.createdAt),
    index('idx_orders_status_created').on(table.status, table.createdAt),
  ],
);

export const orderItems = sqliteTable(
  'order_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    orderId: integer('order_id').notNull().references(() => orders.id),
    productId: integer('product_id').notNull().references(() => products.id),
    assetId: integer('asset_id').notNull().references(() => productAssets.id),
    titleSnapshot: text('title_snapshot').notNull(),
    priceSnapshot: integer('price_snapshot').notNull(),
  },
  (table) => [index('idx_order_items_order').on(table.orderId)],
);

export const entitlements = sqliteTable(
  'entitlements',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    orderItemId: integer('order_item_id').notNull().references(() => orderItems.id),
    userId: integer('user_id').references(() => users.id),
    email: text('email').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_entitlements_order_item').on(table.orderItemId),
    index('idx_entitlements_email').on(table.email),
    index('idx_entitlements_user').on(table.userId),
  ],
);

export const downloadLinks = sqliteTable(
  'download_links',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    orderItemId: integer('order_item_id').notNull().references(() => orderItems.id),
    tokenHash: text('token_hash').notNull(),
    email: text('email').notNull(),
    expiresAt: integer('expires_at').notNull(),
    maxDownloads: integer('max_downloads').notNull().default(5),
    downloadCount: integer('download_count').notNull().default(0),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [uniqueIndex('idx_download_links_token').on(table.tokenHash)],
);

export const downloadEvents = sqliteTable(
  'download_events',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    linkId: integer('link_id').notNull().references(() => downloadLinks.id),
    ipHash: text('ip_hash').notNull(),
    userAgent: text('user_agent').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [index('idx_download_events_link').on(table.linkId)],
);
