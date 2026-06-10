import { afterAll, describe, expect, it } from 'vitest';
import { sql } from '@/lib/db';
import { endDb, hasDb } from './profileFixtures.js';
import { ensurePrimaryProfileForUser } from '@/lib/models/profileHousehold.js';
import * as Profile from '@/lib/models/profile.js';

const d = hasDb ? describe : describe.skip;

// Exercises the getActiveProfileId self-heal path against the real schema:
// creating a household + primary profile for an existing user must satisfy the
// users(id) foreign keys and be idempotent.
d('ensurePrimaryProfileForUser (real DB)', () => {
  const created = { userId: null, householdId: null };

  afterAll(async () => {
    if (created.householdId) await sql`DELETE FROM households WHERE id = ${created.householdId}`;
    if (created.userId) await sql`DELETE FROM users WHERE id = ${created.userId}`;
    await endDb();
  });

  it('creates a household + primary profile for a real user, idempotently', async () => {
    const tag = `ensure_${process.pid}`;
    const [user] = await sql`
      INSERT INTO users (name, email) VALUES (${`Ensure ${tag}`}, ${`${tag}@test.local`}) RETURNING *
    `;
    created.userId = user.id;

    const profile = await ensurePrimaryProfileForUser(user);
    created.householdId = profile.household_id;

    expect(profile.source_user_id).toBe(user.id);

    const [household] = await sql`SELECT * FROM households WHERE id = ${profile.household_id}`;
    expect(household.created_by_user_id).toBe(user.id);

    // Idempotent: a second call returns the same primary profile, not a duplicate.
    const again = await ensurePrimaryProfileForUser(user);
    expect(again.id).toBe(profile.id);

    const primary = await Profile.findPrimaryByUserId(user.id);
    expect(primary.id).toBe(profile.id);
  });
});
