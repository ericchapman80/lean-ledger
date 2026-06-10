import { sql } from '../db.js';

const COLUMN_MAP = {
  recordedAt: 'recorded_at',
  date: 'date',
  weight: 'weight',
  waistMeasurement: 'waist_measurement',
  workoutCompleted: 'workout_completed',
  dayType: 'day_type',
  readingCompleted: 'reading_completed',
  prayerCompleted: 'prayer_completed',
  hydrationOunces: 'hydration_ounces',
  energyLevel: 'energy_level',
  hungerLevel: 'hunger_level',
  sorenessLevel: 'soreness_level',
  bmi: 'bmi',
  bodyFatPercent: 'body_fat_percent',
  skeletalMuscle: 'skeletal_muscle',
  muscleMass: 'muscle_mass',
  proteinPercent: 'protein_percent',
  bmr: 'bmr',
  fatFreeBodyWeight: 'fat_free_body_weight',
  subcutaneousFatPercent: 'subcutaneous_fat_percent',
  visceralFat: 'visceral_fat',
  bodyWaterPercent: 'body_water_percent',
  boneMass: 'bone_mass',
  metabolicAge: 'metabolic_age',
  steps: 'steps',
  activeCalories: 'active_calories',
  restingHeartRate: 'resting_heart_rate',
  sleepHours: 'sleep_hours',
  hrv: 'hrv',
  progressPhotoNote: 'progress_photo_note',
  progressPhotoCount: 'progress_photo_count',
};

export async function upsert(data) {
  const rows = await sql`
    INSERT INTO health_metrics (
      user_id, profile_id, recorded_at, date, weight, waist_measurement, workout_completed, day_type, reading_completed, prayer_completed, hydration_ounces,
      energy_level, hunger_level, soreness_level, bmi, body_fat_percent, skeletal_muscle,
      muscle_mass, protein_percent, bmr, fat_free_body_weight, subcutaneous_fat_percent,
      visceral_fat, body_water_percent, bone_mass, metabolic_age, steps, active_calories,
      resting_heart_rate, sleep_hours, hrv, progress_photo_note, progress_photo_count
    ) VALUES (
      ${data.userId}, ${data.profileId}, ${data.recordedAt}, ${data.date}, ${data.weight}, ${data.waistMeasurement},
      ${data.workoutCompleted}, ${data.dayType}, ${data.readingCompleted}, ${data.prayerCompleted}, ${data.hydrationOunces}, ${data.energyLevel}, ${data.hungerLevel},
      ${data.sorenessLevel}, ${data.bmi}, ${data.bodyFatPercent}, ${data.skeletalMuscle},
      ${data.muscleMass}, ${data.proteinPercent}, ${data.bmr}, ${data.fatFreeBodyWeight},
      ${data.subcutaneousFatPercent}, ${data.visceralFat}, ${data.bodyWaterPercent}, ${data.boneMass},
      ${data.metabolicAge}, ${data.steps}, ${data.activeCalories}, ${data.restingHeartRate},
      ${data.sleepHours}, ${data.hrv}, ${data.progressPhotoNote}, ${data.progressPhotoCount}
    )
    ON CONFLICT (profile_id, recorded_at) DO UPDATE SET
      weight = EXCLUDED.weight,
      waist_measurement = EXCLUDED.waist_measurement,
      workout_completed = EXCLUDED.workout_completed,
      day_type = EXCLUDED.day_type,
      reading_completed = EXCLUDED.reading_completed,
      prayer_completed = EXCLUDED.prayer_completed,
      hydration_ounces = EXCLUDED.hydration_ounces,
      energy_level = EXCLUDED.energy_level,
      hunger_level = EXCLUDED.hunger_level,
      soreness_level = EXCLUDED.soreness_level,
      bmi = EXCLUDED.bmi,
      body_fat_percent = EXCLUDED.body_fat_percent,
      skeletal_muscle = EXCLUDED.skeletal_muscle,
      muscle_mass = EXCLUDED.muscle_mass,
      protein_percent = EXCLUDED.protein_percent,
      bmr = EXCLUDED.bmr,
      fat_free_body_weight = EXCLUDED.fat_free_body_weight,
      subcutaneous_fat_percent = EXCLUDED.subcutaneous_fat_percent,
      visceral_fat = EXCLUDED.visceral_fat,
      body_water_percent = EXCLUDED.body_water_percent,
      bone_mass = EXCLUDED.bone_mass,
      metabolic_age = EXCLUDED.metabolic_age,
      steps = EXCLUDED.steps,
      active_calories = EXCLUDED.active_calories,
      resting_heart_rate = EXCLUDED.resting_heart_rate,
      sleep_hours = EXCLUDED.sleep_hours,
      hrv = EXCLUDED.hrv,
      progress_photo_note = EXCLUDED.progress_photo_note,
      progress_photo_count = EXCLUDED.progress_photo_count,
      updated_at = NOW()
    RETURNING *
  `;
  return formatHealthMetric(rows[0]);
}

export async function findByProfile(profileId, limit = 30) {
  const rows = await sql`
    SELECT * FROM health_metrics
    WHERE profile_id = ${profileId}
    ORDER BY recorded_at DESC
    LIMIT ${limit}
  `;
  return rows.map(formatHealthMetric);
}

export async function findByProfileAndDateRange(profileId, startDate, endDate) {
  const rows = await sql`
    SELECT * FROM health_metrics
    WHERE profile_id = ${profileId} AND date BETWEEN ${startDate} AND ${endDate}
    ORDER BY recorded_at DESC
  `;
  return rows.map(formatHealthMetric);
}

// Deprecated user-scoped reads — used by the stats routes until they migrate.
export async function findByUser(userId, limit = 30) {
  const rows = await sql`
    SELECT * FROM health_metrics
    WHERE user_id = ${userId}
    ORDER BY recorded_at DESC
    LIMIT ${limit}
  `;
  return rows.map(formatHealthMetric);
}

export async function findByUserAndDateRange(userId, startDate, endDate) {
  const rows = await sql`
    SELECT * FROM health_metrics
    WHERE user_id = ${userId} AND date BETWEEN ${startDate} AND ${endDate}
    ORDER BY recorded_at DESC
  `;
  return rows.map(formatHealthMetric);
}

function formatHealthMetric(row) {
  return Object.entries(COLUMN_MAP).reduce((acc, [key, column]) => {
    acc[key] = row[column];
    return acc;
  }, {
    id: row.id,
    userId: row.user_id,
    profileId: row.profile_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}
