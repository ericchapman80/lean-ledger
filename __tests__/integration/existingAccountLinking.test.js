import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { sql } from '@/lib/db';
import { hasDb, endDb } from './profileFixtures.js';
import {
  ensureDefaultHouseholdForUser,
  ensurePrimaryProfileForUser,
  findMembershipForUser,
  linkExistingAccountToHousehold,
  unlinkExistingAccountFromHousehold,
} from '@/lib/models/profileHousehold.js';
import * as Profile from '@/lib/models/profile.js';

const d = hasDb ? describe : describe.skip;

d('existing account household linking (real DB)', () => {
  let ownerUser;
  let linkedUser;
  let ownerHousehold;
  let linkedHousehold;
  let ownerProfile;
  let linkedProfile;

  beforeAll(async () => {
    [ownerUser] = await sql`
      INSERT INTO users (name, email)
      VALUES ('Owner Parent', 'owner.parent@test.local')
      RETURNING *
    `;
    [linkedUser] = await sql`
      INSERT INTO users (name, email)
      VALUES ('Konnor Athlete', 'konnor.athlete@test.local')
      RETURNING *
    `;

    ownerHousehold = await ensureDefaultHouseholdForUser(ownerUser);
    linkedHousehold = await ensureDefaultHouseholdForUser(linkedUser);
    ownerProfile = await ensurePrimaryProfileForUser(ownerUser);
    linkedProfile = await ensurePrimaryProfileForUser(linkedUser);

    await sql`
      INSERT INTO meals (user_id, profile_id, date, meal_name, meal_type, protein, fat, carbs, calories)
      VALUES (${linkedUser.id}, ${linkedProfile.id}, '2026-06-11', 'Chicken Bowl', 'lunch', 40, 15, 50, 500)
    `;
  });

  afterAll(async () => {
    if (ownerHousehold?.id) await sql`DELETE FROM households WHERE id = ${ownerHousehold.id}`;
    if (linkedHousehold?.id) await sql`DELETE FROM households WHERE id = ${linkedHousehold.id}`;
    if (ownerUser?.id) await sql`DELETE FROM users WHERE id = ${ownerUser.id}`;
    if (linkedUser?.id) await sql`DELETE FROM users WHERE id = ${linkedUser.id}`;
    await endDb();
  });

  it('links an existing account into another household without duplicating the primary profile', async () => {
    const result = await linkExistingAccountToHousehold({
      householdId: ownerHousehold.id,
      targetUser: linkedUser,
      role: 'member',
    });

    expect(result.status).toBe('linked');

    const movedProfile = await Profile.findPrimaryByUserId(linkedUser.id);
    expect(movedProfile.household_id).toBe(ownerHousehold.id);

    const membership = await findMembershipForUser(linkedUser.id);
    expect(membership.householdId).toBe(ownerHousehold.id);

    const meals = await sql`SELECT user_id, profile_id FROM meals WHERE user_id = ${linkedUser.id}`;
    expect(meals).toHaveLength(1);
    expect(meals[0].profile_id).toBe(linkedProfile.id);

    const primaryProfiles = await sql`SELECT id FROM profiles WHERE source_user_id = ${linkedUser.id}`;
    expect(primaryProfiles).toHaveLength(1);
  });

  it('unlinks the existing account back to its own default household without deleting data', async () => {
    const result = await unlinkExistingAccountFromHousehold({
      householdId: ownerHousehold.id,
      profileId: linkedProfile.id,
      actingUserId: ownerUser.id,
    });

    expect(result.status).toBe('unlinked');

    const movedBackProfile = await Profile.findPrimaryByUserId(linkedUser.id);
    expect(movedBackProfile.household_id).toBe(linkedHousehold.id);

    const membership = await findMembershipForUser(linkedUser.id);
    expect(membership.householdId).toBe(linkedHousehold.id);

    const meals = await sql`SELECT user_id, profile_id FROM meals WHERE user_id = ${linkedUser.id}`;
    expect(meals).toHaveLength(1);
    expect(meals[0].profile_id).toBe(linkedProfile.id);
  });
});
