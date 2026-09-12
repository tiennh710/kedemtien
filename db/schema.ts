import { bigint, index, integer, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';

const id = (name = 'id') => integer(name).primaryKey().generatedAlwaysAsIdentity();
const epoch = (name: string) => bigint(name, { mode: 'number' });

export const categories = pgTable('categories', {
  id: id(), name: text('name').notNull(), slug: text('slug').notNull(), sortOrder: integer('sort_order').notNull().default(0),
}, (table) => [uniqueIndex('idx_categories_slug').on(table.slug)]);

export const products = pgTable('products', {
  id: id(), categoryId: integer('category_id').references(() => categories.id), slug: text('slug').notNull(), title: text('title').notNull(), shortDescription: text('short_description').notNull(), description: text('description').notNull(), priceVnd: integer('price_vnd').notNull().default(0), licenseNote: text('license_note').notNull().default('Giấy phép sử dụng tiêu chuẩn'), status: text('status', { enum: ['draft', 'published', 'archived'] }).notNull().default('draft'), coverTone: text('cover_tone').notNull().default('indigo'), createdAt: epoch('created_at').notNull(), updatedAt: epoch('updated_at').notNull(), publishedAt: epoch('published_at'),
}, (table) => [uniqueIndex('idx_products_slug').on(table.slug), index('idx_products_status_category').on(table.status, table.categoryId)]);

export const productAssets = pgTable('product_assets', {
  id: id(), productId: integer('product_id').notNull().references(() => products.id), version: integer('version').notNull(), r2Key: text('r2_key').notNull(), originalFilename: text('original_filename').notNull(), contentType: text('content_type').notNull(), sizeBytes: integer('size_bytes').notNull(), sha256: text('sha256').notNull(), createdAt: epoch('created_at').notNull(),
}, (table) => [uniqueIndex('idx_product_assets_key').on(table.r2Key), uniqueIndex('idx_product_assets_version').on(table.productId, table.version)]);

export const productImages = pgTable('product_images', {
  id: id(), productId: integer('product_id').notNull().references(() => products.id), r2Key: text('r2_key').notNull(), contentType: text('content_type').notNull(), altText: text('alt_text').notNull(), sortOrder: integer('sort_order').notNull().default(0), createdAt: epoch('created_at').notNull(),
}, (table) => [uniqueIndex('idx_product_images_key').on(table.r2Key), index('idx_product_images_product_sort').on(table.productId, table.sortOrder)]);

export const users = pgTable('users', {
  id: id(), email: text('email').notNull(), createdAt: epoch('created_at').notNull(),
}, (table) => [uniqueIndex('idx_users_email').on(table.email)]);

export const otpChallenges = pgTable('otp_challenges', {
  id: id(), email: text('email').notNull(), codeHash: text('code_hash').notNull(), ipHash: text('ip_hash').notNull(), expiresAt: epoch('expires_at').notNull(), attempts: integer('attempts').notNull().default(0), consumedAt: epoch('consumed_at'), createdAt: epoch('created_at').notNull(),
}, (table) => [index('idx_otp_email_created').on(table.email, table.createdAt)]);

export const sessions = pgTable('sessions', {
  id: id(), userId: integer('user_id').notNull().references(() => users.id), tokenHash: text('token_hash').notNull(), expiresAt: epoch('expires_at').notNull(), lastSeenAt: epoch('last_seen_at').notNull(), createdAt: epoch('created_at').notNull(),
}, (table) => [uniqueIndex('idx_sessions_token').on(table.tokenHash), index('idx_sessions_user').on(table.userId)]);

export const orders = pgTable('orders', {
  id: id(), orderCode: epoch('order_code').notNull(), email: text('email').notNull(), userId: integer('user_id').references(() => users.id), status: text('status', { enum: ['pending', 'paid', 'cancelled', 'expired', 'refunded'] }).notNull().default('pending'), amountTotal: integer('amount_total').notNull(), payosPaymentLinkId: text('payos_payment_link_id'), deliveryStatus: text('delivery_status', { enum: ['pending', 'sent', 'failed'] }).notNull().default('pending'), deliveryError: text('delivery_error'), createdAt: epoch('created_at').notNull(), paidAt: epoch('paid_at'),
}, (table) => [uniqueIndex('idx_orders_order_code').on(table.orderCode), index('idx_orders_email_created').on(table.email, table.createdAt), index('idx_orders_status_created').on(table.status, table.createdAt)]);

export const orderItems = pgTable('order_items', {
  id: id(), orderId: integer('order_id').notNull().references(() => orders.id), productId: integer('product_id').notNull().references(() => products.id), assetId: integer('asset_id').notNull().references(() => productAssets.id), titleSnapshot: text('title_snapshot').notNull(), priceSnapshot: integer('price_snapshot').notNull(),
}, (table) => [index('idx_order_items_order').on(table.orderId)]);

export const entitlements = pgTable('entitlements', {
  id: id(), orderItemId: integer('order_item_id').notNull().references(() => orderItems.id), userId: integer('user_id').references(() => users.id), email: text('email').notNull(), createdAt: epoch('created_at').notNull(),
}, (table) => [uniqueIndex('idx_entitlements_order_item').on(table.orderItemId), index('idx_entitlements_email').on(table.email), index('idx_entitlements_user').on(table.userId)]);

export const downloadLinks = pgTable('download_links', {
  id: id(), orderItemId: integer('order_item_id').notNull().references(() => orderItems.id), tokenHash: text('token_hash').notNull(), email: text('email').notNull(), expiresAt: epoch('expires_at').notNull(), maxDownloads: integer('max_downloads').notNull().default(5), downloadCount: integer('download_count').notNull().default(0), createdAt: epoch('created_at').notNull(),
}, (table) => [uniqueIndex('idx_download_links_token').on(table.tokenHash)]);

export const downloadEvents = pgTable('download_events', {
  id: id(), linkId: integer('link_id').notNull().references(() => downloadLinks.id), ipHash: text('ip_hash').notNull(), userAgent: text('user_agent').notNull(), createdAt: epoch('created_at').notNull(),
}, (table) => [index('idx_download_events_link').on(table.linkId)]);
