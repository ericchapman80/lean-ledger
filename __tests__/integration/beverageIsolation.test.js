import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanupHousehold, endDb, hasDb, seedHouseholdWithTwoProfiles } from './profileFixtures.js';
import * as BeverageEntry from '@/lib/models/beverageEntry.js';

const d = hasDb ? describe : describe.skip;
const date = '2030-04-10';

function entry(overrides) {
  return {
    amount: 16,
    unit: 'fl_oz',
    amountFlOz: 16,
    recordedAt: `${date}T08:00:00Z`,
    date,
    beverageType: 'water',
    displayName: null,
    countsTowardHydration: true,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    caffeineMg: null,
    ...overrides,
  };
}

d('water_entries (beverages) profile isolation (real DB)', () => {
  let fx;
  let bevA;
  let bevB;

  beforeAll(async () => {
    fx = await seedHouseholdWithTwoProfiles();
    bevA = await BeverageEntry.create(entry({ userId: fx.user.id, profileId: fx.profileA.id, displayName: 'A water' }));
    bevB = await BeverageEntry.create(entry({ userId: fx.user.id, profileId: fx.profileB.id, displayName: 'B juice', beverageType: 'juice' }));
  });

  afterAll(async () => {
    if (fx) await cleanupHousehold(fx);
    await endDb();
  });

  it('persists profile_id and scopes date reads', async () => {
    expect(bevA.profileId).toBe(fx.profileA.id);
    expect((await BeverageEntry.findByProfileAndDate(fx.profileA.id, date)).map((b) => b.displayName)).toEqual(['A water']);
    expect((await BeverageEntry.findByProfileAndDate(fx.profileB.id, date)).map((b) => b.displayName)).toEqual(['B juice']);
  });

  it('findByIdForProfile / update / remove cannot cross profiles', async () => {
    expect(await BeverageEntry.findByIdForProfile(bevB.id, fx.profileA.id)).toBeNull();

    expect(await BeverageEntry.update(bevB.id, fx.profileA.id, entry({ displayName: 'HACK' }))).toBeNull();
    expect((await BeverageEntry.findByIdForProfile(bevB.id, fx.profileB.id)).displayName).toBe('B juice');

    expect(await BeverageEntry.remove(bevB.id, fx.profileA.id)).toBe(false);
    expect(await BeverageEntry.remove(bevB.id, fx.profileB.id)).toBe(true);
    expect(await BeverageEntry.findByIdForProfile(bevB.id, fx.profileB.id)).toBeNull();
  });
});
