#!/usr/bin/env node

import postgres from 'postgres';
import { config } from 'dotenv';
import { getDatabaseUrl } from '../lib/dbUrl.js';
import { getUserOwnedTables, normalizeOwnerClaimInput, summarizeOwnerClaimState } from '../lib/authOwner.js';

config({ path: '.env.local' });
config({ path: '.env' });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Set it in the env file or pass it inline.');
  process.exit(1);
}

const ownerInput = normalizeOwnerClaimInput({
  userId: process.env.AUTH_OWNER_USER_ID,
  email: process.env.AUTH_OWNER_EMAIL,
  name: process.env.AUTH_OWNER_NAME,
  verifyEmail: process.env.AUTH_OWNER_VERIFY_EMAIL !== 'false',
});

const sql = postgres(getDatabaseUrl(process.env), {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 30,
});

try {
  const ownerRows = await sql`
    SELECT id, email, name, "emailVerified"
    FROM users
    WHERE id = ${ownerInput.userId}
    LIMIT 1
  `;

  const conflictingRows = await sql`
    SELECT id, email, name, "emailVerified"
    FROM users
    WHERE lower(email) = ${ownerInput.email}
    AND id <> ${ownerInput.userId}
    LIMIT 1
  `;

  const accountRows = await sql`
    SELECT "userId" AS "userId", provider, "providerAccountId"
    FROM accounts
    WHERE "userId" = ${ownerInput.userId}
    ORDER BY id ASC
  `;

  const counts = {};
  for (const table of getUserOwnedTables()) {
    const rows = await sql.unsafe(`SELECT COUNT(*)::int AS count FROM ${table} WHERE user_id = $1`, [ownerInput.userId]);
    counts[table] = rows[0]?.count ?? 0;
  }

  console.log(JSON.stringify(summarizeOwnerClaimState({
    ownerUser: ownerRows[0] ?? null,
    conflictingUser: conflictingRows[0] ?? null,
    accounts: accountRows,
    counts,
  }), null, 2));
} catch (error) {
  console.error(error.message || error);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 1 });
}
