import { drizzle } from 'drizzle-orm/postgres-js';

import { getPostgresClient } from '@/lib/server/postgres';
import * as schema from './schema';

export function getDb() {
  return drizzle(getPostgresClient(), { schema });
}
