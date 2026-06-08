export function calculateCaloriesFromMacros(protein, fat, carbs) {
  return (protein * 4) + (fat * 9) + (carbs * 4);
}

export function getProgressColor(percentage) {
  if (percentage >= 100) return 'success';
  if (percentage >= 80) return 'primary';
  if (percentage >= 50) return 'warning';
  return 'danger';
}

export function formatMacroValue(value) {
  return Math.round(value * 10) / 10;
}

export function getActivityLevelDescription(level) {
  const descriptions = {
    sedentary: 'Little or no exercise',
    light: 'Light exercise 1-3 days/week',
    moderate: 'Moderate exercise 3-5 days/week',
    active: 'Hard exercise 6-7 days/week',
    very_active: 'Very hard exercise & physical job'
  };
  return descriptions[level] || level;
}

export function getGoalDescription(goal) {
  const descriptions = {
    lose: 'Weight Loss',
    maintain: 'Maintain Weight',
    gain: 'Muscle Gain',
    recomp: 'Lean Recomp',
    fat_loss: 'Fat Loss',
    maintenance: 'Maintenance',
    lean_mass_gain: 'Lean Mass Gain',
    performance_fueling: 'Performance Fueling',
    confidence_fitness: 'Confidence + Fitness',
  };
  return descriptions[goal] || goal;
}

export function getDietStyleDescription(dietStyle) {
  const descriptions = {
    balanced: 'Balanced',
    low_carb: 'Low Carb',
    keto: 'Keto',
    keto_flexible: 'Keto Weekdays / Flexible Weekends',
  };
  return descriptions[dietStyle] || dietStyle;
}
