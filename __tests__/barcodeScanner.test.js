import { describe, expect, it } from 'vitest';
import { getCameraEnvironmentDetails, getCameraErrorDetails } from '@/lib/barcodeScanner.js';

describe('barcode scanner camera permission messaging', () => {
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
});
