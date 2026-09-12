import { createClient } from '@supabase/supabase-js';

import { env } from '@/lib/server/env';

let client: ReturnType<typeof createClient> | undefined;
let bucketsReady: Promise<void> | undefined;

export function getStorageAdmin() {
  if (!client) {
    if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) throw new Error('Supabase Storage chưa được cấu hình.');
    client = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export function bucketForKey(key: string) {
  return key.includes('/images/') ? env.PRODUCT_IMAGES_BUCKET : env.PRODUCT_FILES_BUCKET;
}

export async function ensureStorageBuckets() {
  bucketsReady ??= (async () => {
    const storage = getStorageAdmin().storage;
    const definitions = [
      { id: env.PRODUCT_FILES_BUCKET, options: { public: false, fileSizeLimit: 25 * 1024 * 1024, allowedMimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] } },
      { id: env.PRODUCT_IMAGES_BUCKET, options: { public: false, fileSizeLimit: 5 * 1024 * 1024, allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'] } },
    ];
    for (const definition of definitions) {
      const { error } = await storage.createBucket(definition.id, definition.options);
      if (error && !/already exists|duplicate/i.test(error.message)) throw error;
    }
  })().catch((error) => {
    bucketsReady = undefined;
    throw error;
  });
  await bucketsReady;
}

export function getFilesBucket() {
  return {
    async put(key: string, data: ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }) {
      const { error } = await getStorageAdmin().storage.from(bucketForKey(key)).upload(key, data, {
        contentType: options?.httpMetadata?.contentType,
        upsert: false,
      });
      if (error) throw error;
    },
    async delete(key: string) {
      const { error } = await getStorageAdmin().storage.from(bucketForKey(key)).remove([key]);
      if (error) throw error;
    },
    async createSignedUrl(key: string, expiresIn: number, download?: string) {
      const { data, error } = await getStorageAdmin().storage.from(bucketForKey(key)).createSignedUrl(key, expiresIn, download ? { download } : undefined);
      if (error) throw error;
      return data.signedUrl;
    },
  };
}
