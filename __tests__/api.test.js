import { describe, expect, it } from 'vitest';
import { buildLoginRedirectUrl, SESSION_EXPIRED_MESSAGE } from '@/lib/api.js';

describe('buildLoginRedirectUrl', () => {
  it('sends users back to login with a session-expired reason and next path', () => {
    expect(buildLoginRedirectUrl('/meals?date=2026-06-07'))
      .toBe('/login?reason=session-expired&next=%2Fmeals%3Fdate%3D2026-06-07');
  });

  it('does not add a nested next target when already on login', () => {
    expect(buildLoginRedirectUrl('/login'))
      .toBe('/login?reason=session-expired');
  });

  it('falls back to root for invalid targets', () => {
    expect(buildLoginRedirectUrl('https://example.com')).toBe('/login?reason=session-expired&next=%2F');
  });
});

describe('SESSION_EXPIRED_MESSAGE', () => {
  it('uses a friendly auth-expired message', () => {
    expect(SESSION_EXPIRED_MESSAGE).toBe('Your session expired. Please sign in again.');
  });
});
