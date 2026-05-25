#!/usr/bin/env node
// Versioned migration runner.
// Safe to re-run:
// - applies lib/schema.sql once as the baseline migration
// - then applies any db/migrations/*.sql files in lexical order

import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import postgres from 'postgres';
import { config } from 'dotenv';
import { getDatabaseUrl } from '../lib/dbUrl.js';

config({ path: '.env.local' });
config({ path: '.env' });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Set it in .env.local, .env, or pass it inline.');
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const baselinePath = join(projectRoot, 'lib', 'schema.sql');
const migrationsDir = join(projectRoot, 'db', 'migrations');

const sql = postgres(getDatabaseUrl(process.env));

async function ensureMigrationTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

async function hasMigration(version) {
  const rows = await sql`SELECT 1 FROM schema_migrations WHERE version = ${version} LIMIT 1`;
  return rows.length > 0;
}

async function markMigration(version) {
  await sql`
    INSERT INTO schema_migrations (version)
    VALUES (${version})
    ON CONFLICT (version) DO NOTHING
  `;
}

async function applySqlFile(version, path) {
  if (await hasMigration(version)) {
    console.log(`- Skipping ${version} (already applied)`);
    return;
  }

  console.log(`→ Applying ${version}`);
  const contents = await fs.readFile(path, 'utf8');
  await sql.begin(async (tx) => {
    await tx.unsafe(contents);
    await tx`
      INSERT INTO schema_migrations (version)
      VALUES (${version})
      ON CONFLICT (version) DO NOTHING
    `;
  });
  console.log(`✓ Applied ${version}`);
}

try {
  await ensureMigrationTable();
  await applySqlFile('000_baseline_schema', baselinePath);

  let entries = [];
  try {
    entries = await fs.readdir(migrationsDir, { withFileTypes: true });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const migrationFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort();

  for (const name of migrationFiles) {
    await applySqlFile(name, join(migrationsDir, name));
  }

  console.log('✓ Database migrations complete');
} finally {
  await sql.end();
}
