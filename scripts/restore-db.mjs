#!/usr/bin/env node
// Restore a custom-format dump into a Postgres database.
// Usage:
//   DATABASE_URL=postgresql://... npm run db:restore -- ./backup.dump

import { spawn } from 'node:child_process';
import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

const databaseUrl = process.env.DATABASE_URL;
const dumpFile = process.argv[2];

if (!databaseUrl) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

if (!dumpFile) {
  console.error('Usage: DATABASE_URL=... npm run db:restore -- ./backup.dump');
  process.exit(1);
}

const args = [
  '--dbname',
  databaseUrl,
  '--no-owner',
  '--no-privileges',
  '--single-transaction',
  dumpFile,
];

const child = spawn('pg_restore', args, { stdio: 'inherit' });

child.on('exit', (code) => {
  if (code === 0) {
    console.log(`✓ Restored database from ${dumpFile}`);
    process.exit(0);
  }
  process.exit(code ?? 1);
});
