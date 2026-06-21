import { formatDisplayDate } from '@/lib/utils/dateUtils.js';
import { getHealthMetricDisplayValue } from '@/lib/healthMetrics.js';
import { getWeightDisplayValue } from '@/lib/utils/unitUtils.js';

const DISPLAY_MASS_HEALTH_FIELDS = ['muscleMass', 'fatFreeBodyWeight', 'boneMass'];
const ADVANCED_METRIC_GROUPS = [
  {
    key: 'bodyComposition',
    title: 'Body Composition Trends',
    fields: ['bodyFatPercent', 'skeletalMuscle', 'muscleMass', 'bodyWaterPercent'],
  },
  {
    key: 'metabolism',
    title: 'Metabolism Trends',
    fields: ['bmr', 'proteinPercent', 'fatFreeBodyWeight', 'metabolicAge'],
  },
  {
    key: 'recovery',
    title: 'Recovery Trends',
    fields: ['restingHeartRate', 'hrv'],
  },
  {
    key: 'activity',
    title: 'Activity Trends',
    fields: ['steps', 'activeCalories'],
  },
];

function toChartNumber(value) {
  if (value == null || value === '') return null;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function normalizeDisplayValue(fieldKey, value, units) {
  if (DISPLAY_MASS_HEALTH_FIELDS.includes(fieldKey)) {
    return getHealthMetricDisplayValue(fieldKey, value, units);
  }
  return toChartNumber(value);
}

export function buildTrendChartData(dailySeries, units = 'metric') {
  return dailySeries.map((entry) => {
    const displayEntry = {
      ...entry,
      displayDate: formatDisplayDate(entry.date),
      weight: toChartNumber(getWeightDisplayValue(entry.weight, units)),
      sevenDayAverageWeight: toChartNumber(getWeightDisplayValue(entry.sevenDayAverageWeight, units)),
    };

    for (const fieldKey of DISPLAY_MASS_HEALTH_FIELDS) {
      displayEntry[fieldKey] = normalizeDisplayValue(fieldKey, entry[fieldKey], units);
    }

    for (const fieldKey of ['bodyFatPercent', 'skeletalMuscle', 'bodyWaterPercent', 'bmr', 'proteinPercent', 'metabolicAge', 'restingHeartRate', 'hrv', 'steps', 'activeCalories']) {
      displayEntry[fieldKey] = normalizeDisplayValue(fieldKey, entry[fieldKey], units);
    }

    return displayEntry;
  });
}

export function buildAdvancedMetricGroups(entries) {
  return ADVANCED_METRIC_GROUPS
    .map((group) => {
      const fields = group.fields.filter((field) => entries.some((entry) => toChartNumber(entry[field]) != null));
      if (fields.length === 0) {
        return null;
      }

      const rows = entries.filter((entry) => fields.some((field) => toChartNumber(entry[field]) != null));
      const series = fields.map((field) => ({
        key: field,
        pointCount: rows.filter((entry) => toChartNumber(entry[field]) != null).length,
      }));

      return {
        ...group,
        fields,
        rows,
        series,
      };
    })
    .filter(Boolean);
}
