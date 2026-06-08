const AGE_GROUPS = {
  child: 'Child',
  teen: 'Teen',
  adult: 'Adult',
};

export const GOAL_STRATEGIES = [
  'fat_loss',
  'lean_recomp',
  'maintenance',
  'lean_mass_gain',
  'performance_fueling',
  'confidence_fitness',
];

export const ACTIVITY_FOCUS_OPTIONS = [
  'football',
  'track_field',
  'strength_training',
  'general_fitness',
  'walking',
  'mobility_recovery',
  'none',
];

export const COACHING_MODES = [
  'weight_management',
  'general_wellness',
  'youth_wellness',
  'youth_athlete',
  'athlete_performance',
  'lean_mass_gain',
];

const GOAL_STRATEGY_TO_LEGACY_GOAL = {
  fat_loss: 'lose',
  lean_recomp: 'recomp',
  maintenance: 'maintain',
  lean_mass_gain: 'gain',
  performance_fueling: 'maintain',
  confidence_fitness: 'maintain',
};

export function calculateAgeFromDateOfBirth(dateOfBirth, referenceDate = new Date()) {
  if (!dateOfBirth) return null;
  const dob = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return null;

  let age = referenceDate.getFullYear() - dob.getFullYear();
  const monthDelta = referenceDate.getMonth() - dob.getMonth();
  const dayDelta = referenceDate.getDate() - dob.getDate();

  if (monthDelta < 0 || (monthDelta === 0 && dayDelta < 0)) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export function deriveAgeGroup({ dateOfBirth, age } = {}) {
  const derivedAge = dateOfBirth ? calculateAgeFromDateOfBirth(dateOfBirth) : age;
  if (derivedAge == null) return null;
  if (derivedAge < 13) return 'child';
  if (derivedAge < 18) return 'teen';
  return 'adult';
}

export function getAgeGroupDescription(ageGroup) {
  return ageGroup ? AGE_GROUPS[ageGroup] || ageGroup : null;
}

export function normalizeActivityFocus(activityFocus = []) {
  if (!Array.isArray(activityFocus)) return [];

  const normalized = Array.from(new Set(activityFocus.filter((value) => ACTIVITY_FOCUS_OPTIONS.includes(value))));
  if (normalized.includes('none') && normalized.length > 1) {
    return normalized.filter((value) => value !== 'none');
  }

  return normalized;
}

export function mapGoalStrategyToLegacyGoal(goalStrategy = 'maintenance') {
  return GOAL_STRATEGY_TO_LEGACY_GOAL[goalStrategy] || 'maintain';
}

export function deriveCoachingMode({ ageGroup, goalStrategy, activityFocus = [] } = {}) {
  const normalizedFocus = normalizeActivityFocus(activityFocus);
  const isAthlete = normalizedFocus.some((focus) => ['football', 'track_field', 'strength_training'].includes(focus));

  if (ageGroup === 'child') {
    return isAthlete ? 'youth_athlete' : 'youth_wellness';
  }

  if (ageGroup === 'teen') {
    if (isAthlete) return 'youth_athlete';
    if (goalStrategy === 'fat_loss') return 'youth_wellness';
    return 'youth_wellness';
  }

  if (goalStrategy === 'lean_mass_gain') return 'lean_mass_gain';
  if (goalStrategy === 'fat_loss' || goalStrategy === 'lean_recomp') return 'weight_management';
  if (goalStrategy === 'performance_fueling' || isAthlete) return 'athlete_performance';
  return 'general_wellness';
}

export function getGoalStrategyDescription(goalStrategy) {
  const descriptions = {
    fat_loss: 'Fat Loss',
    lean_recomp: 'Lean Recomp',
    maintenance: 'Maintenance',
    lean_mass_gain: 'Lean Mass Gain',
    performance_fueling: 'Performance Fueling',
    confidence_fitness: 'Confidence + Fitness',
  };
  return descriptions[goalStrategy] || goalStrategy;
}

export function getActivityFocusDescription(activityFocus) {
  const descriptions = {
    football: 'Football',
    track_field: 'Track & Field',
    strength_training: 'Strength Training',
    general_fitness: 'General Fitness',
    walking: 'Walking',
    mobility_recovery: 'Mobility / Recovery',
    none: 'None',
  };
  return descriptions[activityFocus] || activityFocus;
}

export function getCoachingModeDescription(coachingMode) {
  const descriptions = {
    weight_management: 'Weight Management',
    general_wellness: 'General Wellness',
    youth_wellness: 'Youth Wellness',
    youth_athlete: 'Youth Athlete',
    athlete_performance: 'Athlete Performance',
    lean_mass_gain: 'Lean Mass Gain',
  };
  return descriptions[coachingMode] || coachingMode;
}
