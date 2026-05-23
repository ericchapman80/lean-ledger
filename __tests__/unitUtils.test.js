import { describe, it, expect } from 'vitest';
import {
  cmToFeetInches,
  feetInchesToCm,
  formatHeight,
  kgToLbs,
  lbsToKg,
  formatWeight,
} from '@/lib/utils/unitUtils.js';

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
