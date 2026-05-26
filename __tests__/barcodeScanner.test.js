import { describe, expect, it } from 'vitest';
import {
  getBarcodeSupportDetails,
  getCameraEnvironmentDetails,
  getCameraErrorDetails,
  getScannerFailureDetails,
} from '@/lib/barcodeScanner.js';

describe('barcode scanner camera permission messaging', () => {
  it('prefers the native BarcodeDetector path when available', () => {
    const result = getBarcodeSupportDetails({
      hasBarcodeDetector: true,
      hasFallbackScanner: true,
    });

    expect(result.mode).toBe('native');
    expect(result.code).toBe('native_supported');
  });

  it('falls back to the compatibility scanner when native support is missing', () => {
    const result = getBarcodeSupportDetails({
      hasBarcodeDetector: false,
      hasFallbackScanner: true,
    });

    expect(result.mode).toBe('fallback');
    expect(result.code).toBe('native_unsupported_fallback_available');
    expect(result.message).toContain('compatibility scanner');
  });

  it('returns manual-only guidance when no scanner path is available', () => {
    const result = getBarcodeSupportDetails({
      hasBarcodeDetector: false,
      hasFallbackScanner: false,
    });

    expect(result.mode).toBe('manual_only');
    expect(result.code).toBe('scanner_unavailable');
    expect(result.message).toContain('Enter the barcode manually');
  });

  it('returns iPhone-friendly recovery steps for denied permissions', () => {
    const result = getCameraErrorDetails({ name: 'NotAllowedError' });

    expect(result.code).toBe('permission_denied');
    expect(result.title).toBe('Camera permission is off');
    expect(result.steps).toContain('Open iPhone Settings.');
    expect(result.steps).toContain('Go to Safari or Chrome.');
    expect(result.steps).toContain('Tap Camera.');
    expect(result.steps).toContain('Choose Ask or Allow.');
    expect(result.steps).toContain('Return to the app and tap Retry Camera.');
  });

  it('returns a retryable message when the camera is busy', () => {
    const result = getCameraErrorDetails({ name: 'NotReadableError' });

    expect(result.code).toBe('camera_busy');
    expect(result.canRetry).toBe(true);
    expect(result.steps[0]).toContain('Close other apps or tabs');
  });

  it('returns a fallback-oriented message when no camera is found', () => {
    const result = getCameraErrorDetails({ name: 'NotFoundError' });

    expect(result.code).toBe('camera_missing');
    expect(result.steps[1]).toContain('Search Food or Add Food Manually');
  });

  it('returns an HTTPS diagnostic when the browser context is not secure', () => {
    const result = getCameraEnvironmentDetails({
      isSecureContext: false,
      hasMediaDevices: true,
      hasGetUserMedia: true,
    });

    expect(result.code).toBe('insecure_context');
    expect(result.message).toContain('Camera scanning requires HTTPS on mobile browsers');
    expect(result.message).toContain('http://192.168.x.x:3000');
    expect(result.steps[0]).toContain('HTTPS');
  });

  it('returns an unsupported-context diagnostic when getUserMedia is unavailable', () => {
    const result = getCameraEnvironmentDetails({
      isSecureContext: true,
      hasMediaDevices: false,
      hasGetUserMedia: false,
    });

    expect(result.code).toBe('unsupported_browser_context');
    expect(result.steps[1]).toContain('private or incognito mode');
  });

  it('returns a fallback-specific scanner failure diagnostic', () => {
    const result = getScannerFailureDetails({ code: 'native_unsupported_fallback_available' });

    expect(result.code).toBe('native_unsupported_fallback_available');
    expect(result.title).toBe('Using compatibility scanner');
    expect(result.canRetry).toBe(true);
  });

  it('returns a generic manual-fallback scanner error', () => {
    const result = getScannerFailureDetails(new Error('decode failed'));

    expect(result.code).toBe('scanner_failed');
    expect(result.message).toContain('enter the barcode manually');
  });
});
