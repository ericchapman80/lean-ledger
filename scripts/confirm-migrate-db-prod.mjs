#!/usr/bin/env node

import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const bypass = process.env.CONFIRM_MIGRATE_DB_PROD === 'YES';

if (bypass) {
  console.log('CONFIRM_MIGRATE_DB_PROD=YES set. Proceeding with production migrate-db.');
  process.exit(0);
}

const rl = createInterface({ input, output });

try {
  output.write('Warning: migrate-db:prod applies pending DDL/DML to the Neon production database.\n');
  output.write('Take a backup (npm run db:export) and rehearse in preview (npm run migrate-db:preview) first.\n');
  output.write('Builds must not run migrate-db; schema changes should never happen during a Vercel build.\n');
  const answer = await rl.question('Type "migrate production" to continue: ');

  if (answer.trim() !== 'migrate production') {
    output.write('Cancelled migrate-db:prod.\n');
    process.exit(1);
  }
} finally {
  rl.close();
}
