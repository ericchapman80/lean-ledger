import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('hydration trend layout', () => {
  it('renders hydration trend conditionally instead of showing a large empty chart', () => {
    const source = readFileSync(join(process.cwd(), 'app/trends/page.jsx'), 'utf8');

    expect(source).toContain('{hasHydrationData && (');
    expect(source).toContain('7-Day Average Hydration');
    expect(source).not.toContain('EmptyTrendCard title="Hydration Trend"');
  });
});
