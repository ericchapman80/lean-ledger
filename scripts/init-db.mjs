#!/usr/bin/env node
// One-shot schema initializer. Safe to re-run.
// Usage:
//   node scripts/init-db.mjs                  (reads DATABASE_URL from .env.local)
//   DATABASE_URL=postgres://... node scripts/init-db.mjs

import { neon } from '@neondatabase/serverless';
import { readFile } from 'node:fs/promises';
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
const schema = await readFile(schemaPath, 'utf8');

const sql = neon(process.env.DATABASE_URL);

const statements = schema
  .split(/;\s*$/m)
  .map((s) => s.trim())
  .filter((s) => s && !s.startsWith('--'));

for (const statement of statements) {
  console.log(`→ ${statement.split('\n')[0].slice(0, 80)}...`);
  await sql.query(statement);
}

console.log('✓ Schema initialized');
