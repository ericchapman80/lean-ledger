#!/usr/bin/env node

import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const bypass = process.env.CONFIRM_INIT_DB_PROD === 'YES';

if (bypass) {
  console.log('CONFIRM_INIT_DB_PROD=YES set. Proceeding with production init-db.');
  process.exit(0);
}

const rl = createInterface({ input, output });

try {
  output.write('Warning: init-db:prod should only target the Neon production database.\n');
  output.write('Builds must not run init-db because schema changes should never happen during Vercel build.\n');
  const answer = await rl.question('Type "init production" to continue: ');

  if (answer.trim() !== 'init production') {
    output.write('Cancelled init-db:prod.\n');
    process.exit(1);
  }
} finally {
  rl.close();
}
