#!/usr/bin/env node

import postgres from 'postgres';
import { config } from 'dotenv';
import { getDatabaseUrl } from '../lib/dbUrl.js';
import { normalizeOwnerClaimInput } from '../lib/authOwner.js';

config({ path: '.env.local' });
config({ path: '.env' });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Set it in the env file or pass it inline.');
  process.exit(1);
}

const claim = normalizeOwnerClaimInput({
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
  const summary = await sql.begin(async (tx) => {
    const owners = await tx`SELECT id, email, name, "emailVerified" FROM users WHERE id = ${claim.userId} LIMIT 1`;
    const owner = owners[0];

    if (!owner) {
      throw new Error(`Owner user ${claim.userId} does not exist.`);
    }

    const conflicts = await tx`
      SELECT id, email, name, "emailVerified"
      FROM users
      WHERE lower(email) = ${claim.email}
      AND id <> ${claim.userId}
      LIMIT 1
    `;

    if (conflicts[0]) {
      throw new Error(
        `Email ${claim.email} already belongs to user ${conflicts[0].id}. Resolve that before claiming the owner row.`,
      );
    }

    const updated = await tx`
      UPDATE users
      SET
        email = ${claim.email},
        name = ${claim.name},
        "emailVerified" = ${claim.verifyEmail ? tx`NOW()` : owner.emailVerified},
        updated_at = NOW()
      WHERE id = ${claim.userId}
      RETURNING id, email, name, "emailVerified"
    `;

    return updated[0];
  });

  console.log(JSON.stringify({
    ok: true,
    ownerUserId: summary.id,
    email: summary.email,
    name: summary.name,
    emailVerified: summary.emailVerified,
  }, null, 2));
} catch (error) {
  console.error(error.message || error);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 1 });
}
