import postgres from 'postgres';

import { schemaStatements } from '../lib/server/postgres';

const url = process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
if (!url) throw new Error('Thiếu POSTGRES_URL_NON_POOLING hoặc POSTGRES_URL.');

const sql = postgres(url, { prepare: false });
try {
  for (const statement of schemaStatements) await sql.unsafe(statement);
  console.log(`Đã áp dụng ${schemaStatements.length} câu lệnh schema.`);
} finally {
  await sql.end();
}
