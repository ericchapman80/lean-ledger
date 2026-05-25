/**
 * Unit conversion utilities for height and weight
 */

function round(value, precision = 1) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

// Height conversions
export function cmToFeetInches(cm) {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}

export function feetInchesToCm(feet, inches) {
  const totalInches = feet * 12 + inches;
  return Math.round(totalInches * 2.54 * 10) / 10;
}

export function cmToInches(cm) {
  return round(cm / 2.54, 1);
}

export function inchesToCm(inches) {
  return round(inches * 2.54, 1);
}

export function formatHeight(cm, units) {
  if (units === 'imperial') {
    const { feet, inches } = cmToFeetInches(cm);
    return `${feet}'${inches}"`;
  }
  return `${Math.round(cm)} cm`;
}

// Weight conversions
export function kgToLbs(kg) {
  return round(kg * 2.20462, 1);
}

export function lbsToKg(lbs) {
  return round(lbs / 2.20462, 1);
}

export function formatWeight(kg, units) {
  if (units === 'imperial') {
    return `${kgToLbs(kg)} lbs`;
  }
  return `${Math.round(kg * 10) / 10} kg`;
}

// For form inputs
export function getHeightLabel(units) {
  return units === 'imperial' ? 'Height' : 'Height (cm)';
}

export function getWeightLabel(units) {
  return units === 'imperial' ? 'Weight (lbs)' : 'Weight (kg)';
}

// Volume conversions
export function flOzToMl(flOz) {
  return round(flOz * 29.5735, 1);
}

export function mlToFlOz(ml) {
  return round(ml / 29.5735, 1);
}
