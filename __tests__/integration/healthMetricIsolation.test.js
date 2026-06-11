import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanupHousehold, endDb, hasDb, seedHouseholdWithTwoProfiles } from './profileFixtures.js';
import * as HealthMetric from '@/lib/models/healthMetric.js';

const d = hasDb ? describe : describe.skip;
const recordedAt = '2030-05-10T07:00:00Z';
const date = '2030-05-10';

// HealthMetric.upsert references every metric column; postgres.js rejects
// undefined values, so build a fully-null normalized object (as the route's
// validateHealthMetricEntry does) and override only the fields under test.
const HM_KEYS = [
  'weight', 'waistMeasurement', 'workoutCompleted', 'dayType', 'readingCompleted',
  'prayerCompleted', 'hydrationOunces', 'energyLevel', 'hungerLevel', 'sorenessLevel',
  'bmi', 'bodyFatPercent', 'skeletalMuscle', 'muscleMass', 'proteinPercent', 'bmr',
  'fatFreeBodyWeight', 'subcutaneousFatPercent', 'visceralFat', 'bodyWaterPercent',
  'boneMass', 'metabolicAge', 'steps', 'activeCalories', 'restingHeartRate',
  'sleepHours', 'hrv', 'progressPhotoNote', 'progressPhotoCount',
];

function hm(overrides) {
  const base = { recordedAt, date };
  for (const k of HM_KEYS) base[k] = null;
  return { ...base, ...overrides };
}

d('health_metrics profile isolation (real DB)', () => {
  let fx;

  beforeAll(async () => {
    fx = await seedHouseholdWithTwoProfiles();
    await HealthMetric.upsert(hm({ userId: fx.user.id, profileId: fx.profileA.id, weight: 80, sleepHours: 8 }));
    await HealthMetric.upsert(hm({ userId: fx.user.id, profileId: fx.profileB.id, weight: 40, sleepHours: 10 }));
  });

  afterAll(async () => {
    if (fx) await cleanupHousehold(fx);
    await endDb();
  });

  it('keeps same-timestamp upserts separate per profile (profile-scoped uniqueness)', async () => {
    const a = await HealthMetric.findByProfile(fx.profileA.id);
    const b = await HealthMetric.findByProfile(fx.profileB.id);
    expect(a.map((m) => m.weight)).toEqual([80]);
    expect(b.map((m) => m.weight)).toEqual([40]);
  });

  it('re-upserting one profile updates only that profile', async () => {
    await HealthMetric.upsert(hm({ userId: fx.user.id, profileId: fx.profileA.id, weight: 81, sleepHours: 7 }));
    expect((await HealthMetric.findByProfile(fx.profileA.id))[0].weight).toBe(81);
    expect((await HealthMetric.findByProfile(fx.profileB.id))[0].weight).toBe(40);
  });

  it('date-range reads are scoped to the active profile', async () => {
    const range = await HealthMetric.findByProfileAndDateRange(fx.profileB.id, '2030-05-01', '2030-05-31');
    expect(range.every((m) => m.profileId === fx.profileB.id)).toBe(true);
    expect(range.map((m) => m.weight)).toEqual([40]);
  });
});
