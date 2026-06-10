import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanupHousehold, endDb, hasDb, seedHouseholdWithTwoProfiles } from './profileFixtures.js';
import * as Weight from '@/lib/models/weight.js';

const d = hasDb ? describe : describe.skip;
const date = '2030-03-10';

d('weight_logs profile isolation (real DB)', () => {
  let fx;

  beforeAll(async () => {
    fx = await seedHouseholdWithTwoProfiles();
    await Weight.upsert({ userId: fx.user.id, profileId: fx.profileA.id, date, weight: 80 });
    await Weight.upsert({ userId: fx.user.id, profileId: fx.profileB.id, date, weight: 40 });
  });

  afterAll(async () => {
    if (fx) await cleanupHousehold(fx);
    await endDb();
  });

  it('keeps same-date upserts separate per profile (profile-scoped uniqueness)', async () => {
    expect((await Weight.findByProfileAndDate(fx.profileA.id, date)).weight).toBe(80);
    expect((await Weight.findByProfileAndDate(fx.profileB.id, date)).weight).toBe(40);
  });

  it('re-upserting one profile updates only that profile', async () => {
    await Weight.upsert({ userId: fx.user.id, profileId: fx.profileA.id, date, weight: 82 });
    expect((await Weight.findByProfileAndDate(fx.profileA.id, date)).weight).toBe(82);
    expect((await Weight.findByProfileAndDate(fx.profileB.id, date)).weight).toBe(40);
  });

  it('list/range reads are scoped to the active profile', async () => {
    expect((await Weight.findByProfile(fx.profileA.id)).every((w) => w.profileId === fx.profileA.id)).toBe(true);
    const range = await Weight.findByProfileAndDateRange(fx.profileA.id, '2030-03-01', '2030-03-31');
    expect(range.map((w) => w.weight)).toEqual([82]);
  });
});
