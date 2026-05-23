#!/usr/bin/env node
// One-shot schema initializer. Safe to re-run.
// Usage:
//   node scripts/init-db.mjs                  (reads DATABASE_URL from .env.local)
//   DATABASE_URL=postgres://... node scripts/init-db.mjs

import postgres from 'postgres';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Set it in .env.local or pass it inline.');
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, '..', 'lib', 'schema.sql');

const sql = postgres(process.env.DATABASE_URL);
try {
  await sql.file(schemaPath);
  console.log('✓ Schema initialized');
} finally {
  await sql.end();
}
