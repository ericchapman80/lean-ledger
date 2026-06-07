#!/usr/bin/env node

import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const email = process.env.AUTH_OWNER_EMAIL;

if (!email) {
  console.error('AUTH_OWNER_EMAIL is required before running the production owner claim.');
  process.exit(1);
}

const rl = readline.createInterface({ input, output });

try {
  const answer = await rl.question(
    `Type CLAIM ${email} to confirm updating the production owner row: `,
  );

  if (answer.trim() !== `CLAIM ${email}`) {
    console.error('Owner claim aborted.');
    process.exit(1);
  }
} finally {
  rl.close();
}
