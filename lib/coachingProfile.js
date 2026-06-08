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

export const DAY_TYPE_OPTIONS = [
  'workout_day',
  'practice_day',
  'competition_day',
  'recovery_day',
  'rest_day',
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

const GOAL_STRATEGY_DESCRIPTIONS = {
  fat_loss: 'Fat Loss',
  lean_recomp: 'Lean Recomp',
  maintenance: 'Maintenance',
  lean_mass_gain: 'Lean Mass Gain',
  performance_fueling: 'Performance Fueling',
  confidence_fitness: 'Confidence + Fitness',
};

const ACTIVITY_FOCUS_DESCRIPTIONS = {
  football: 'Football',
  track_field: 'Track & Field',
  strength_training: 'Strength Training',
  general_fitness: 'General Fitness',
  walking: 'Walking',
  mobility_recovery: 'Mobility / Recovery',
  none: 'None',
};

const COACHING_MODE_DESCRIPTIONS = {
  weight_management: 'Weight Management',
  general_wellness: 'General Wellness',
  youth_wellness: 'Youth Wellness',
  youth_athlete: 'Youth Athlete',
  athlete_performance: 'Athlete Performance',
  lean_mass_gain: 'Lean Mass Gain',
};

const DAY_TYPE_DESCRIPTIONS = {
  workout_day: 'Workout Day',
  practice_day: 'Practice Day',
  competition_day: 'Competition / Game Day',
  recovery_day: 'Recovery Day',
  rest_day: 'Rest Day',
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

export function isAthleteActivityFocus(activityFocus = []) {
  const normalizedFocus = normalizeActivityFocus(activityFocus);
  return normalizedFocus.some((focus) => ['football', 'track_field', 'strength_training'].includes(focus));
}

export function deriveCoachingMode({ ageGroup, goalStrategy, activityFocus = [] } = {}) {
  const normalizedFocus = normalizeActivityFocus(activityFocus);
  const isAthlete = isAthleteActivityFocus(normalizedFocus);

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

export function getAllowedGoalStrategies({ ageGroup, activityFocus = [] } = {}) {
  const isAthlete = isAthleteActivityFocus(activityFocus);

  if (ageGroup === 'child') {
    return isAthlete
      ? ['performance_fueling', 'confidence_fitness', 'maintenance']
      : ['confidence_fitness', 'maintenance'];
  }

  if (ageGroup === 'teen') {
    return isAthlete
      ? ['performance_fueling', 'lean_mass_gain', 'confidence_fitness', 'maintenance']
      : ['confidence_fitness', 'maintenance', 'lean_mass_gain'];
  }

  return GOAL_STRATEGIES;
}

export function normalizeGoalStrategyForAge({ ageGroup, goalStrategy, activityFocus = [] } = {}) {
  const allowedStrategies = getAllowedGoalStrategies({ ageGroup, activityFocus });
  if (!goalStrategy || allowedStrategies.includes(goalStrategy)) {
    return goalStrategy || allowedStrategies[0] || 'maintenance';
  }
  return allowedStrategies[0] || 'maintenance';
}

export function getSafeMacroGoal({ ageGroup, goalStrategy, activityFocus = [] } = {}) {
  const safeGoalStrategy = normalizeGoalStrategyForAge({ ageGroup, goalStrategy, activityFocus });

  if (ageGroup === 'child') {
    return 'maintain';
  }

  if (ageGroup === 'teen') {
    if (safeGoalStrategy === 'lean_mass_gain') return 'gain';
    return 'maintain';
  }

  return mapGoalStrategyToLegacyGoal(safeGoalStrategy);
}

export function getYouthSafetyMessage({ ageGroup, coachingMode } = {}) {
  if (ageGroup === 'child') {
    return 'Child profiles focus on movement, hydration, sleep, active play, and confidence instead of calorie deficits or weight-loss coaching.';
  }

  if (ageGroup === 'teen') {
    if (coachingMode === 'youth_athlete') {
      return 'Teen athlete profiles emphasize fueling, hydration, sleep, soreness, and recovery instead of aggressive cutting or appearance-driven coaching.';
    }
    return 'Teen profiles avoid aggressive calorie deficits and keep the coaching focused on energy, recovery, consistency, and healthy habits.';
  }

  return null;
}

export function getDayTypeGuidance({ dayType, coachingMode, ageGroup } = {}) {
  if (!dayType) return null;

  const youthPrefix = ageGroup && ageGroup !== 'adult'
    ? 'Keep the focus on energy, hydration, sleep, and recovery.'
    : null;

  const guidance = {
    workout_day: coachingMode === 'youth_athlete' || coachingMode === 'athlete_performance'
      ? 'Fuel around training, stay on top of hydration, and use soreness and sleep as recovery signals.'
      : 'Use workout days to support protein consistency, hydration, and recovery habits.',
    practice_day: 'Practice days should lean toward hydration, steady energy, and post-practice recovery.',
    competition_day: 'Competition and game days should prioritize hydration, easy-to-tolerate fueling, and recovery after the event.',
    recovery_day: 'Recovery days should focus on sleep, hydration, soreness, and low-friction habits that help you bounce back.',
    rest_day: 'Rest days should keep the routine steady without forcing intensity. Focus on hydration, sleep, and consistency.',
  };

  return [guidance[dayType], youthPrefix].filter(Boolean).join(' ');
}

export function getGoalStrategyDescription(goalStrategy) {
  return GOAL_STRATEGY_DESCRIPTIONS[goalStrategy] || goalStrategy;
}

export function getActivityFocusDescription(activityFocus) {
  return ACTIVITY_FOCUS_DESCRIPTIONS[activityFocus] || activityFocus;
}

export function getCoachingModeDescription(coachingMode) {
  return COACHING_MODE_DESCRIPTIONS[coachingMode] || coachingMode;
}

export function getDayTypeDescription(dayType) {
  return DAY_TYPE_DESCRIPTIONS[dayType] || dayType;
}
