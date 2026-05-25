#!/usr/bin/env node
// One-time data copy helper from source Postgres -> target Postgres.
// Schema should already exist on the target via `npm run migrate-db`.
// Usage:
//   SOURCE_DATABASE_URL=postgresql://localhost:5432/lean_ledger \
//   TARGET_DATABASE_URL=postgresql://<neon-url> \
//   npm run db:copy

import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code ?? 1}`));
      }
    });
  });
}

const sourceUrl = process.env.SOURCE_DATABASE_URL;
const targetUrl = process.env.TARGET_DATABASE_URL;

if (!sourceUrl || !targetUrl) {
  console.error('SOURCE_DATABASE_URL and TARGET_DATABASE_URL must both be set.');
  process.exit(1);
}

const tempFile = path.join(os.tmpdir(), `lean-ledger-copy-${randomUUID()}.dump`);

try {
  console.log('→ Exporting source data');
  await run('pg_dump', [
    sourceUrl,
    '--format=custom',
    '--data-only',
    '--no-owner',
    '--no-privileges',
    '--exclude-table=schema_migrations',
    '--file',
    tempFile,
  ]);

  console.log('→ Restoring data into target');
  await run('pg_restore', [
    '--dbname',
    targetUrl,
    '--data-only',
    '--no-owner',
    '--no-privileges',
    '--single-transaction',
    tempFile,
  ]);

  console.log('✓ Database copy complete');
} finally {
  await rm(tempFile, { force: true });
}
