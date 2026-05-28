import { describe, expect, it } from 'vitest';
import { buildTrendChartData } from '@/lib/trendDisplay.js';
import { formatDisplayWeightValue } from '@/lib/utils/unitUtils.js';

describe('buildTrendChartData', () => {
  it('renders imperial profile weight trends in lb without changing canonical analytics', () => {
    const dailySeries = [
      {
        date: '2026-05-24',
        weight: 102.7,
        sevenDayAverageWeight: 103.1,
        muscleMass: 40,
      },
    ];

    const chartData = buildTrendChartData(dailySeries, 'imperial');

    expect(dailySeries[0].weight).toBe(102.7);
    expect(chartData[0].weight).toBe(226.4);
    expect(chartData[0].sevenDayAverageWeight).toBe(227.3);
    expect(chartData[0].muscleMass).toBe(88.2);
    expect(formatDisplayWeightValue(chartData[0].sevenDayAverageWeight, 'imperial')).toBe('227.3 lb');
  });

  it('renders metric profile weight trends in kg', () => {
    const chartData = buildTrendChartData([
      {
        date: '2026-05-24',
        weight: 102.7,
        sevenDayAverageWeight: 103.1,
      },
    ], 'metric');

    expect(chartData[0].weight).toBe(102.7);
    expect(chartData[0].sevenDayAverageWeight).toBe(103.1);
    expect(formatDisplayWeightValue(chartData[0].weight, 'metric')).toBe('102.7 kg');
  });
});
