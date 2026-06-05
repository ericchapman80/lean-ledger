import { describe, expect, it } from 'vitest';
import { getAuthMode, hasAuthCredentials, isAuthEnabled } from '@/lib/authConfig.js';

describe('authConfig', () => {
  const fullEnv = {
    AUTH_SECRET: 'secret',
    AUTH_GOOGLE_ID: 'google-id',
    AUTH_GOOGLE_SECRET: 'google-secret',
    DATABASE_URL: 'postgresql://example.com/db',
  };

  it('detects when auth credentials are present', () => {
    expect(hasAuthCredentials(fullEnv)).toBe(true);
    expect(hasAuthCredentials({ AUTH_SECRET: 'secret' })).toBe(false);
  });

  it('requires AUTH_ENABLED=true before auth is active', () => {
    expect(isAuthEnabled(fullEnv)).toBe(false);
    expect(isAuthEnabled({ ...fullEnv, AUTH_ENABLED: 'true' })).toBe(true);
  });

  it('reports disabled, configured, and enabled auth modes', () => {
    expect(getAuthMode({})).toBe('disabled');
    expect(getAuthMode(fullEnv)).toBe('configured');
    expect(getAuthMode({ ...fullEnv, AUTH_ENABLED: 'true' })).toBe('enabled');
  });
});
