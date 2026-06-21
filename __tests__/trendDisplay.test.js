import { describe, expect, it } from 'vitest';
import { buildAdvancedMetricGroups, buildTrendChartData } from '@/lib/trendDisplay';
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

describe('trendDisplay advanced metric normalization', () => {
  const sampleSeries = [
    {
      date: '2026-05-25',
      bodyFatPercent: '18.3',
      muscleMass: '79.696',
      skeletalMuscle: null,
      bodyWaterPercent: null,
      proteinPercent: null,
      fatFreeBodyWeight: null,
      bmr: null,
      metabolicAge: null,
    },
    {
      date: '2026-06-07',
      bodyFatPercent: '17.9',
      muscleMass: '77.701',
      skeletalMuscle: undefined,
      bodyWaterPercent: null,
      proteinPercent: '',
      fatFreeBodyWeight: null,
      bmr: undefined,
      metabolicAge: null,
    },
    {
      date: '2026-06-20',
      bodyFatPercent: '17.2',
      muscleMass: '76.794',
      skeletalMuscle: null,
      bodyWaterPercent: null,
      proteinPercent: null,
      fatFreeBodyWeight: null,
      bmr: null,
      metabolicAge: null,
    },
  ];

  it('preserves partial health-metric rows and converts numeric strings safely', () => {
    const chartData = buildTrendChartData(sampleSeries, 'imperial');

    expect(chartData).toHaveLength(3);
    expect(chartData.map((entry) => entry.bodyFatPercent)).toEqual([18.3, 17.9, 17.2]);
    expect(chartData.map((entry) => entry.muscleMass)).toEqual([175.7, 171.3, 169.3]);
    expect(chartData.every((entry) => typeof entry.bodyFatPercent === 'number')).toBe(true);
    expect(chartData.every((entry) => typeof entry.muscleMass === 'number')).toBe(true);
  });

  it('builds chart groups only from series with at least one valid numeric value', () => {
    const chartData = buildTrendChartData(sampleSeries, 'imperial');
    const groups = buildAdvancedMetricGroups(chartData);

    const bodyComposition = groups.find((group) => group.key === 'bodyComposition');
    const metabolism = groups.find((group) => group.key === 'metabolism');

    expect(bodyComposition).toBeTruthy();
    expect(bodyComposition.fields).toEqual(['bodyFatPercent', 'muscleMass']);
    expect(bodyComposition.rows).toHaveLength(3);
    expect(bodyComposition.series).toEqual([
      { key: 'bodyFatPercent', pointCount: 3 },
      { key: 'muscleMass', pointCount: 3 },
    ]);

    expect(metabolism).toBeUndefined();
  });

  it('retains a single valid point so sparse series can still render visibly', () => {
    const chartData = buildTrendChartData([
      {
        date: '2026-06-20',
        bodyFatPercent: '17.2',
        muscleMass: '76.794',
        bmr: null,
      },
    ], 'imperial');

    const [bodyComposition] = buildAdvancedMetricGroups(chartData);
    expect(bodyComposition.rows).toHaveLength(1);
    expect(bodyComposition.series).toEqual([
      { key: 'bodyFatPercent', pointCount: 1 },
      { key: 'muscleMass', pointCount: 1 },
    ]);
  });
});
