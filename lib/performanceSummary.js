import { buildPerformanceTrendGroups } from './performanceMetrics.js';
import { formatDisplayDate } from './utils/dateUtils.js';

function round(value) {
  return Math.round(value);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function average(values) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function scoreSleep(hours) {
  if (!Number.isFinite(hours)) return null;
  if (hours >= 8) return 100;
  if (hours >= 7) return 88;
  if (hours >= 6) return 72;
  if (hours >= 5) return 55;
  return 35;
}

function scoreEnergy(level) {
  if (!Number.isFinite(level)) return null;
  return [0, 35, 55, 72, 88, 100][level] ?? null;
}

function scoreSoreness(level) {
  if (!Number.isFinite(level)) return null;
  return [0, 100, 90, 75, 55, 35][level] ?? null;
}

function scoreHydration(current, target) {
  if (!Number.isFinite(current) || !Number.isFinite(target) || target <= 0) return null;
  return clamp(round((current / target) * 100), 0, 100);
}

function formatHydrationSignal(current, target) {
  if (!Number.isFinite(current) || !Number.isFinite(target) || target <= 0) return null;
  return `${round(current)} / ${round(target)} oz`;
}

function getReadinessStatus(score) {
  if (score == null) {
    return {
      key: 'unknown',
      label: 'Not enough data',
      color: 'var(--text-secondary)',
      summary: 'Add sleep, energy, soreness, or hydration to estimate readiness.',
    };
  }
  if (score >= 80) {
    return {
      key: 'green',
      label: 'Ready',
      color: 'var(--success-color)',
      summary: 'Recovery signals are supportive of a stronger session.',
    };
  }
  if (score >= 65) {
    return {
      key: 'yellow',
      label: 'Watch',
      color: 'var(--warning-color)',
      summary: 'Some signals are mixed. Train, but pay attention to recovery quality.',
    };
  }
  return {
    key: 'red',
    label: 'Recover',
    color: 'var(--danger-color)',
    summary: 'Recovery is lagging. Bias toward hydration, sleep, and lower-friction work.',
  };
}

function getMomentumStatus(improvingCount, decliningCount) {
  if (improvingCount === 0 && decliningCount === 0) {
    return {
      key: 'steady',
      label: 'Building baseline',
      color: 'var(--text-secondary)',
      summary: 'More than one entry per metric is needed before trend direction means much.',
    };
  }
  if (improvingCount > decliningCount) {
    return {
      key: 'up',
      label: 'Trending up',
      color: 'var(--success-color)',
      summary: 'Recent performance entries show more improvement than regression.',
    };
  }
  if (decliningCount > improvingCount) {
    return {
      key: 'down',
      label: 'Needs attention',
      color: 'var(--warning-color)',
      summary: 'Some tracked performance markers are slipping and may need recovery or technique attention.',
    };
  }
  return {
    key: 'steady',
    label: 'Mixed',
    color: 'var(--primary-color)',
    summary: 'Recent entries are mixed. Keep the focus on consistency and recovery quality.',
  };
}

function isRecent(recordedAt, windowDays, referenceTime) {
  if (!recordedAt) return false;
  const timestamp = new Date(recordedAt).getTime();
  if (Number.isNaN(timestamp)) return false;
  const diffMs = referenceTime - timestamp;
  return diffMs >= 0 && diffMs <= windowDays * 24 * 60 * 60 * 1000;
}

export function buildPerformanceReadiness(latestMetric, hydrationTarget = null) {
  if (!latestMetric) {
    return {
      score: null,
      status: getReadinessStatus(null),
      signals: [],
      lowestSignal: null,
    };
  }

  const signals = [
    {
      key: 'sleep',
      label: 'Sleep',
      score: scoreSleep(Number(latestMetric.sleepHours)),
      valueLabel: Number.isFinite(Number(latestMetric.sleepHours)) ? `${latestMetric.sleepHours} hr` : null,
    },
    {
      key: 'energy',
      label: 'Energy',
      score: scoreEnergy(Number(latestMetric.energyLevel)),
      valueLabel: Number.isFinite(Number(latestMetric.energyLevel)) ? `${latestMetric.energyLevel} / 5` : null,
    },
    {
      key: 'soreness',
      label: 'Soreness',
      score: scoreSoreness(Number(latestMetric.sorenessLevel)),
      valueLabel: Number.isFinite(Number(latestMetric.sorenessLevel)) ? `${latestMetric.sorenessLevel} / 5` : null,
    },
    {
      key: 'hydration',
      label: 'Hydration',
      score: scoreHydration(Number(latestMetric.hydrationOunces), hydrationTarget),
      valueLabel: formatHydrationSignal(Number(latestMetric.hydrationOunces), hydrationTarget),
    },
  ].filter((signal) => signal.score != null);

  const score = signals.length > 0 ? round(average(signals.map((signal) => signal.score))) : null;
  const status = getReadinessStatus(score);
  const lowestSignal = signals.length > 0
    ? signals.reduce((lowest, signal) => (lowest == null || signal.score < lowest.score ? signal : lowest), null)
    : null;

  return {
    score,
    status,
    signals,
    lowestSignal,
  };
}

export function buildPerformanceSummary({
  performanceMetrics = [],
  latestMetric = null,
  hydrationTarget = null,
  referenceDate = new Date(),
} = {}) {
  const groups = buildPerformanceTrendGroups(performanceMetrics, 'metric');
  const readiness = buildPerformanceReadiness(latestMetric, hydrationTarget);
  const referenceTime = referenceDate instanceof Date ? referenceDate.getTime() : new Date(referenceDate).getTime();

  let improvingCount = 0;
  let decliningCount = 0;
  let stableCount = 0;
  let recentPersonalBests = 0;

  for (const group of groups) {
    if (group.deltaSincePrevious == null || group.deltaSincePrevious === 0) {
      stableCount += 1;
    } else if (
      (group.betterDirection === 'up' && group.deltaSincePrevious > 0)
      || (group.betterDirection === 'down' && group.deltaSincePrevious < 0)
    ) {
      improvingCount += 1;
    } else {
      decliningCount += 1;
    }

    if (group.latest && group.best && group.latest.id === group.best.id && isRecent(group.latest.recordedAt, 21, referenceTime)) {
      recentPersonalBests += 1;
    }
  }

  const momentum = getMomentumStatus(improvingCount, decliningCount);
  const topMetric = groups.find((group) => group.latest && group.best && group.latest.id === group.best.id) || groups[0] || null;
  const latestSession = performanceMetrics.length > 0
    ? [...performanceMetrics]
      .filter((entry) => entry?.recordedAt)
      .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0]
    : null;

  const focusMessage = readiness.status.key === 'red'
    ? 'Back off the pressure and double down on sleep, hydration, and soreness management before chasing output.'
    : readiness.lowestSignal?.key === 'sleep'
      ? 'Sleep is the biggest limiter right now. Better readiness likely comes from fixing sleep first.'
      : readiness.lowestSignal?.key === 'hydration'
        ? 'Hydration is the easiest lever to improve before the next session.'
        : momentum.key === 'down'
          ? 'Performance markers are mixed or sliding. Check recovery quality and session setup before forcing progression.'
          : recentPersonalBests > 0
            ? 'You have recent PR-level movement. Keep recovery stable and let consistency do the work.'
            : 'Keep logging a few repeat metrics so Lean Ledger can separate noise from real progress.';

  return {
    readiness,
    momentum: {
      ...momentum,
      improvingCount,
      decliningCount,
      stableCount,
    },
    recentPersonalBests,
    activeMetricsCount: groups.length,
    latestSessionDate: latestSession?.date || null,
    latestSessionLabel: latestSession?.date ? formatDisplayDate(latestSession.date) : null,
    topMetricLabel: topMetric?.label || null,
    focusMessage,
    hasData: groups.length > 0 || readiness.score != null,
  };
}
