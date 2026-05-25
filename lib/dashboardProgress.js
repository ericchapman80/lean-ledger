function round(value) {
  return Math.round(value);
}

function toOneDecimal(value) {
  return Math.round(value * 10) / 10;
}

function formatGrams(value) {
  return Number.isInteger(value) ? String(value) : toOneDecimal(value).toFixed(1);
}

const STATE_META = {
  excellent: {
    colorVar: 'var(--success-color)',
    className: 'success',
    icon: '✓',
    label: 'On target',
  },
  warning: {
    colorVar: 'var(--warning-color)',
    className: 'warning',
    icon: '!',
    label: 'Approaching limit',
  },
  over: {
    colorVar: 'var(--danger-color)',
    className: 'danger',
    icon: '↑',
    label: 'Over target',
  },
  info: {
    colorVar: 'var(--secondary-color)',
    className: 'info',
    icon: '•',
    label: 'In progress',
  },
};

function getProteinState(ratio) {
  if (ratio >= 0.7) return 'excellent';
  if (ratio >= 0.4) return 'warning';
  return 'info';
}

function getCarbState(ratio, dietStyle) {
  const stricter = ['keto', 'low_carb', 'keto_flexible'].includes(dietStyle);
  if (stricter) {
    if (ratio < 0.8) return 'excellent';
    if (ratio <= 1) return 'warning';
    return 'over';
  }

  if (ratio <= 1) return 'excellent';
  if (ratio <= 1.15) return 'warning';
  return 'over';
}

function getFatState(ratio) {
  if (ratio <= 1) return 'excellent';
  if (ratio <= 1.15) return 'warning';
  return 'over';
}

function getCalorieState(ratio) {
  if (ratio <= 1) return 'excellent';
  if (ratio <= 1.1) return 'warning';
  return 'over';
}

export function getWaterProgressSemantics({
  current,
  target,
  currentHour = new Date().getHours(),
  isCurrentDay = true,
}) {
  const safeCurrent = Number(current || 0);
  const safeTarget = Number(target || 0);
  const ratio = safeTarget > 0 ? safeCurrent / safeTarget : 0;
  const percentage = safeTarget > 0 ? round(ratio * 100) : 0;
  const cappedPercentage = Math.max(0, Math.min(percentage, 100));
  const remaining = Math.max(safeTarget - safeCurrent, 0);
  const overBy = Math.max(safeCurrent - safeTarget, 0);

  let state = 'info';
  if (ratio >= 1) {
    state = 'info';
  } else if (ratio >= 0.8) {
    state = 'excellent';
  } else if (isCurrentDay && currentHour >= 17 && ratio < 0.5) {
    state = 'warning';
  }

  const meta = STATE_META[state];

  return {
    state,
    colorVar: state === 'info' && ratio >= 1 ? 'var(--primary-color)' : meta.colorVar,
    className: meta.className,
    icon: ratio >= 1 ? '+' : meta.icon,
    stateLabel: ratio >= 1 ? 'Hydrated' : (state === 'excellent' ? 'Near target' : meta.label),
    percentage,
    cappedPercentage,
    remaining,
    overBy,
  };
}

export function getProgressSemantics({ macroKey, current, target, dietStyle = 'balanced' }) {
  const safeCurrent = Number(current || 0);
  const safeTarget = Number(target || 0);
  const ratio = safeTarget > 0 ? safeCurrent / safeTarget : 0;
  const percentage = safeTarget > 0 ? round(ratio * 100) : 0;
  const cappedPercentage = Math.max(0, Math.min(percentage, 100));
  const remaining = Math.max(safeTarget - safeCurrent, 0);
  const overBy = Math.max(safeCurrent - safeTarget, 0);

  let state = 'info';
  switch (macroKey) {
    case 'protein':
      state = getProteinState(ratio);
      break;
    case 'carbs':
      state = getCarbState(ratio, dietStyle);
      break;
    case 'fat':
      state = getFatState(ratio);
      break;
    case 'calories':
      state = getCalorieState(ratio);
      break;
    default:
      state = ratio >= 1 ? 'excellent' : 'info';
  }

  const meta = STATE_META[state];
  const amountLabel = safeTarget > 0
    ? overBy > 0
      ? `+${formatGrams(overBy)}${macroKey === 'calories' ? ' kcal' : 'g'}`
      : `${formatGrams(remaining)}${macroKey === 'calories' ? ' kcal' : 'g'} left`
    : '';

  const ratioLabel = safeTarget > 0
    ? `${formatGrams(safeCurrent)}/${formatGrams(safeTarget)}${macroKey === 'calories' ? ' kcal' : 'g'}`
    : `${formatGrams(safeCurrent)}${macroKey === 'calories' ? ' kcal' : 'g'}`;

  return {
    state,
    colorVar: meta.colorVar,
    className: meta.className,
    icon: meta.icon,
    stateLabel: meta.label,
    percentage,
    cappedPercentage,
    remaining,
    overBy,
    ratioLabel,
    amountLabel,
  };
}
