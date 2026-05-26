import { describe, expect, it } from 'vitest';
import { formatDate, getRequestLocalDate, getRequestTimeZone } from '@/lib/utils/dateUtils.js';

describe('timezone-safe date helpers', () => {
  it('keeps a local datetime-local entry on the same local day', () => {
    expect(formatDate('2026-05-25T22:16')).toBe('2026-05-25');
  });

  it('converts a UTC timestamp to the user local day when a timezone is supplied', () => {
    expect(formatDate('2026-05-26T02:16:00.000Z', { timeZone: 'America/New_York' })).toBe('2026-05-25');
  });

  it('uses request headers for local-date fallback resolution', () => {
    const request = {
      headers: new Headers({
        'x-time-zone': 'America/New_York',
        'x-local-date': '2026-05-25',
      }),
    };

    expect(getRequestTimeZone(request)).toBe('America/New_York');
    expect(getRequestLocalDate(request)).toBe('2026-05-25');
  });
});
