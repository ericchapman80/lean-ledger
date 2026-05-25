import { describe, it, expect } from 'vitest';
import {
  cmToFeetInches,
  cmToInches,
  feetInchesToCm,
  flOzToMl,
  formatHeight,
  kgToLbs,
  lbsToKg,
  inchesToCm,
  mlToFlOz,
  formatWeight,
} from '@/lib/utils/unitUtils.js';
import { getDateDaysBefore, getElapsedWeekDays, getEndOfWeek, getStartOfWeek } from '@/lib/utils/dateUtils.js';

describe('cmToFeetInches', () => {
  it('converts 175 cm to about 5\'9"', () => {
    expect(cmToFeetInches(175)).toEqual({ feet: 5, inches: 9 });
  });
});

describe('feetInchesToCm', () => {
  it('converts 5\'9" to about 175 cm', () => {
    expect(feetInchesToCm(5, 9)).toBeCloseTo(175.3, 1);
  });
});

describe('inch/cm helpers', () => {
  it('converts inches to cm', () => {
    expect(inchesToCm(32)).toBeCloseTo(81.3, 1);
  });

  it('converts cm to inches', () => {
    expect(cmToInches(81.3)).toBeCloseTo(32, 1);
  });
});

describe('formatHeight', () => {
  it('formats imperial as feet/inches', () => {
    expect(formatHeight(175, 'imperial')).toBe(`5'9"`);
  });
  it('formats metric as cm', () => {
    expect(formatHeight(175, 'metric')).toBe('175 cm');
  });
});

describe('kg/lbs round-trip', () => {
  it('survives a round trip within tolerance', () => {
    expect(kgToLbs(lbsToKg(160))).toBeCloseTo(160, 0);
  });
  it('converts 75 kg to about 165.3 lbs', () => {
    expect(kgToLbs(75)).toBeCloseTo(165.3, 1);
  });
});

describe('formatWeight', () => {
  it('formats imperial in lbs', () => {
    expect(formatWeight(75, 'imperial')).toMatch(/lbs$/);
  });
  it('formats metric in kg', () => {
    expect(formatWeight(75, 'metric')).toBe('75 kg');
  });
});

describe('volume helpers', () => {
  it('converts fluid ounces to ml', () => {
    expect(flOzToMl(16)).toBeCloseTo(473.2, 1);
  });

  it('converts ml to fluid ounces', () => {
    expect(mlToFlOz(473.2)).toBeCloseTo(16, 1);
  });
});

describe('week date helpers', () => {
  it('uses Monday as the start of week', () => {
    expect(getStartOfWeek('2026-05-24')).toBe('2026-05-18');
    expect(getEndOfWeek('2026-05-24')).toBe('2026-05-24');
  });

  it('counts elapsed days in the current week', () => {
    expect(getElapsedWeekDays('2026-05-24')).toBe(7);
    expect(getElapsedWeekDays('2026-05-20')).toBe(3);
  });

  it('calculates relative dates from a supplied date', () => {
    expect(getDateDaysBefore('2026-05-24', 6)).toBe('2026-05-18');
  });
});
