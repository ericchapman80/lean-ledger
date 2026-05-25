#!/usr/bin/env node
// Export a Postgres database to a custom-format dump.
// Usage:
//   DATABASE_URL=postgresql://... npm run db:export -- ./backup.dump

import { spawn } from 'node:child_process';
import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

const databaseUrl = process.env.DATABASE_URL;
const outputFile = process.argv[2] || `lean-ledger-${new Date().toISOString().replace(/[:.]/g, '-')}.dump`;

if (!databaseUrl) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const args = [
  databaseUrl,
  '--format=custom',
  '--no-owner',
  '--no-privileges',
  '--file',
  outputFile,
];

const child = spawn('pg_dump', args, { stdio: 'inherit' });

child.on('exit', (code) => {
  if (code === 0) {
    console.log(`✓ Exported database to ${outputFile}`);
    process.exit(0);
  }
  process.exit(code ?? 1);
});
