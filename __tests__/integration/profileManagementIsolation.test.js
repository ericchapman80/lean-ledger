import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanupHousehold, endDb, hasDb, seedHouseholdWithTwoProfiles } from './profileFixtures.js';
import * as Profile from '@/lib/models/profile.js';
import { findMembershipForUser } from '@/lib/models/profileHousehold.js';

const d = hasDb ? describe : describe.skip;

d('profile management + household isolation (real DB)', () => {
  let h1; // household 1 (user1: primary profileA + dependent profileB)
  let h2; // household 2 (separate user/household)

  beforeAll(async () => {
    h1 = await seedHouseholdWithTwoProfiles();
    h2 = await seedHouseholdWithTwoProfiles();
  });

  afterAll(async () => {
    if (h1) await cleanupHousehold(h1);
    if (h2) await cleanupHousehold(h2);
    await endDb();
  });

  it('findMembershipForUser returns the owner household + role', async () => {
    const m = await findMembershipForUser(h1.user.id);
    expect(m.householdId).toBe(h1.household.id);
    expect(m.role).toBe('owner');
    expect(await findMembershipForUser(-1)).toBeNull();
  });

  it('lists profiles for a household with the primary first', async () => {
    const list = await Profile.listByHousehold(h1.household.id);
    expect(list.length).toBe(2);
    expect(list[0].isPrimary).toBe(true);
    expect(list[0].sourceUserId).toBe(h1.user.id);
    expect(list[1].isDependent).toBe(true);
  });

  it('creates a dependent profile in the household', async () => {
    const kid = await Profile.createDependent({
      householdId: h1.household.id, managedByUserId: h1.user.id, name: 'Teen Athlete',
      dateOfBirth: '2010-05-01', height: 170, weight: 60, gender: 'male', activityLevel: 'active', goal: 'maintain',
    });
    expect(kid.isPrimary).toBe(false);
    expect(kid.isDependent).toBe(true);
    expect(kid.householdId).toBe(h1.household.id);
    expect(kid.sourceUserId).toBeNull();
  });

  it('findByIdInHousehold and isAccessibleToUser do not cross households', async () => {
    expect(await Profile.findByIdInHousehold(h1.profileB.id, h1.household.id)).not.toBeNull();
    expect(await Profile.findByIdInHousehold(h1.profileB.id, h2.household.id)).toBeNull();

    expect(await Profile.isAccessibleToUser(h1.profileB.id, h1.user.id)).toBe(true);
    expect(await Profile.isAccessibleToUser(h1.profileB.id, h2.user.id)).toBe(false);
  });

  it('refuses to delete a primary profile, allows deleting a dependent', async () => {
    // primary (source_user_id set) cannot be removed via removeDependent
    expect(await Profile.removeDependent(h1.profileA.id, h1.household.id)).toBe(false);
    expect(await Profile.findByIdInHousehold(h1.profileA.id, h1.household.id)).not.toBeNull();

    // cross-household delete is a no-op
    expect(await Profile.removeDependent(h1.profileB.id, h2.household.id)).toBe(false);

    // owner removes a dependent in their own household
    expect(await Profile.removeDependent(h1.profileB.id, h1.household.id)).toBe(true);
    expect(await Profile.findByIdInHousehold(h1.profileB.id, h1.household.id)).toBeNull();
  });

  it('update is scoped to the household', async () => {
    const kid = await Profile.createDependent({
      householdId: h1.household.id, managedByUserId: h1.user.id, name: 'Kid', gender: 'female',
    });
    expect(await Profile.update(kid.id, h2.household.id, { name: 'HACK' })).toBeNull();
    const ok = await Profile.update(kid.id, h1.household.id, { name: 'Kid Renamed', gender: 'female' });
    expect(ok.name).toBe('Kid Renamed');
  });
});
