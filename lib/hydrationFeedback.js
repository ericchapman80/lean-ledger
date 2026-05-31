import { getHydrationContributionFlOz } from '@/lib/beverages.js';

const LATE_DAY_CUTOFF_HOUR = 17;
const CAFFEINE_HEAVY_MG = 180;
const PARTIAL_HYDRATION_GAP_FL_OZ = 20;

function round(value) {
  return Math.round(value);
}

function getEntryHour(recordedAt) {
  if (!recordedAt || typeof recordedAt !== 'string') return null;
  const matched = recordedAt.match(/T(\d{2}):(\d{2})/);
  if (!matched) return null;
  return Number(matched[1]);
}

function buildHydrationInsights(entries = [], summary) {
  const totals = entries.reduce((acc, entry) => {
    const amountFlOz = Number(entry.amountFlOz || 0);
    const hydrationContributionFlOz = Number(entry.hydrationContributionFlOz ?? getHydrationContributionFlOz(entry));
    const caffeineMg = Number(entry.caffeineMg || 0);
    const hour = getEntryHour(entry.recordedAt);
    const isLateDay = hour != null && hour >= LATE_DAY_CUTOFF_HOUR;
    const isCaffeinated = caffeineMg > 0 || ['black_coffee', 'unsweet_tea', 'keto_coffee', 'diet_drink'].includes(entry.beverageType);

    acc.totalHydrationFlOz += hydrationContributionFlOz;
    acc.totalFluidsFlOz += amountFlOz;
    acc.totalCaffeineMg += caffeineMg;

    if (isLateDay) {
      acc.lateDayHydrationFlOz += hydrationContributionFlOz;
    }

    if (isCaffeinated) {
      acc.caffeinatedHydrationFlOz += hydrationContributionFlOz;
    }
    return acc;
  }, {
    totalHydrationFlOz: 0,
    totalFluidsFlOz: 0,
    totalCaffeineMg: 0,
    lateDayHydrationFlOz: 0,
    caffeinatedHydrationFlOz: 0,
  });

  return {
    totalHydrationFlOz: round(totals.totalHydrationFlOz),
    totalFluidsFlOz: round(totals.totalFluidsFlOz),
    totalCaffeineMg: round(totals.totalCaffeineMg),
    lateDayHydrationFlOz: round(totals.lateDayHydrationFlOz),
    caffeinatedHydrationFlOz: round(totals.caffeinatedHydrationFlOz),
    lateDayShare: totals.totalHydrationFlOz > 0 ? totals.lateDayHydrationFlOz / totals.totalHydrationFlOz : 0,
    caffeinatedShare: totals.totalHydrationFlOz > 0 ? totals.caffeinatedHydrationFlOz / totals.totalHydrationFlOz : 0,
  };
}

export function getHydrationFeedback({
  entries = [],
  summary,
  workoutCompleted = false,
  dietStyle = 'balanced',
  isCurrentDay = false,
  currentHour = 12,
}) {
  if (!summary || entries.length === 0) return null;

  const hydrationFlOz = Number(summary.hydrationFlOz || 0);
  const targetFlOz = Number(summary.targetFlOz || 0);
  const totalFluidsFlOz = Number(summary.totalFluidsFlOz || 0);
  const progressRatio = targetFlOz > 0 ? hydrationFlOz / targetFlOz : 0;
  const hydrationGapFlOz = Math.max(totalFluidsFlOz - hydrationFlOz, 0);
  const insights = buildHydrationInsights(entries, summary);

  if (isCurrentDay && currentHour >= 15 && progressRatio < 0.45) {
    return {
      tone: 'neutral',
      shortLabel: 'Behind on hydration',
      message: 'Most of your hydration target is still ahead of you today. Adding fluids earlier usually makes the rest of the day easier.',
    };
  }

  if (progressRatio >= 1 && workoutCompleted) {
    return {
      tone: 'positive',
      shortLabel: 'Workout hydration covered',
      message: 'You covered the day\'s hydration target including the workout adjustment.',
    };
  }

  if (progressRatio >= 0.85 && hydrationGapFlOz < PARTIAL_HYDRATION_GAP_FL_OZ) {
    return {
      tone: 'positive',
      shortLabel: 'Hydration on track',
      message: 'Your weighted hydration is on pace for the day without relying heavily on partial-credit drinks.',
    };
  }

  if (insights.lateDayHydrationFlOz >= 24 && insights.lateDayShare >= 0.5) {
    return {
      tone: 'neutral',
      shortLabel: 'Late-day hydration load',
      message: `More than half of today's hydration landed after ${LATE_DAY_CUTOFF_HOUR % 12 || 12}:00 PM. Spreading fluids earlier may feel easier.`,
    };
  }

  if (insights.totalCaffeineMg >= CAFFEINE_HEAVY_MG && insights.caffeinatedShare >= 0.45) {
    return {
      tone: 'neutral',
      shortLabel: 'Caffeine-heavy mix',
      message: 'A large share of hydration came from caffeinated drinks. Adding more water or electrolytes would balance the mix.',
    };
  }

  if (hydrationGapFlOz >= PARTIAL_HYDRATION_GAP_FL_OZ) {
    return {
      tone: 'neutral',
      shortLabel: 'Fluids not counting fully',
      message: 'You logged solid fluid volume, but a meaningful chunk is coming from drinks that only count partially toward hydration.',
    };
  }

  if (dietStyle === 'keto' || dietStyle === 'keto_flexible') {
    return {
      tone: 'positive',
      shortLabel: 'Hydration matters here',
      message: 'Low-carb days usually feel better when hydration stays steady instead of getting backloaded.',
    };
  }

  return null;
}
