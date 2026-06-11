// Real-DB isolation harness for V2.2 Family Profiles (Phase 2).
//
// Seeds a household with two profiles (a primary "parent" profile and a
// dependent "kid" profile) so tests can prove that profile-scoped queries
// never cross the profile boundary. Reused by every per-table isolation suite.
//
// Gated on DATABASE_URL: runs in CI (the `validate` job provisions Postgres and
// runs migrations) and locally when a DB is available; skips otherwise.

import { sql } from '@/lib/db';

export const hasDb = Boolean(process.env.DATABASE_URL);

let counter = 0;

// Creates: one auth user, one household (user is owner), a primary profile
// (source_user_id = user) and a dependent profile (managed by the user).
export async function seedHouseholdWithTwoProfiles() {
  counter += 1;
  const tag = `iso_${process.pid}_${counter}_${Math.floor(counter * 7919) % 100000}`;

  const [user] = await sql`
    INSERT INTO users (name, email)
    VALUES (${`Iso Parent ${tag}`}, ${`${tag}@test.local`})
    RETURNING *
  `;

  const [household] = await sql`
    INSERT INTO households (name, created_by_user_id)
    VALUES (${`Household ${tag}`}, ${user.id})
    RETURNING *
  `;

  await sql`
    INSERT INTO household_members (household_id, user_id, role)
    VALUES (${household.id}, ${user.id}, 'owner')
  `;

  const [profileA] = await sql`
    INSERT INTO profiles (household_id, source_user_id, managed_by_user_id, name)
    VALUES (${household.id}, ${user.id}, ${user.id}, ${`Parent ${tag}`})
    RETURNING *
  `;

  const [profileB] = await sql`
    INSERT INTO profiles (household_id, managed_by_user_id, name, is_dependent)
    VALUES (${household.id}, ${user.id}, ${`Kid ${tag}`}, true)
    RETURNING *
  `;

  return { user, household, profileA, profileB };
}

// Deleting the household cascades profiles -> cascades each data table's
// profile_id rows; deleting the user cascades household_members and any
// user_id rows. Either order is safe; we do both to be thorough.
export async function cleanupHousehold(fixture) {
  if (fixture?.household?.id) {
    await sql`DELETE FROM households WHERE id = ${fixture.household.id}`;
  }
  if (fixture?.user?.id) {
    await sql`DELETE FROM users WHERE id = ${fixture.user.id}`;
  }
}

export async function endDb() {
  await sql.end({ timeout: 1 });
}
