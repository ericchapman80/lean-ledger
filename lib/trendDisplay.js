import { formatDisplayDate } from '@/lib/utils/dateUtils.js';
import { getHealthMetricDisplayValue } from '@/lib/healthMetrics.js';
import { getWeightDisplayValue } from '@/lib/utils/unitUtils.js';

const DISPLAY_MASS_HEALTH_FIELDS = ['muscleMass', 'fatFreeBodyWeight', 'boneMass'];

export function buildTrendChartData(dailySeries, units = 'metric') {
  return dailySeries.map((entry) => {
    const displayEntry = {
      ...entry,
      displayDate: formatDisplayDate(entry.date),
      weight: getWeightDisplayValue(entry.weight, units),
      sevenDayAverageWeight: getWeightDisplayValue(entry.sevenDayAverageWeight, units),
    };

    for (const fieldKey of DISPLAY_MASS_HEALTH_FIELDS) {
      displayEntry[fieldKey] = getHealthMetricDisplayValue(fieldKey, entry[fieldKey], units);
    }

    return displayEntry;
  });
}
