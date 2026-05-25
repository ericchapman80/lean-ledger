import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('dashboard hydration layout', () => {
  it('keeps hydration summary on the dashboard without intake entry controls', () => {
    const source = readFileSync(join(process.cwd(), 'app/page.jsx'), 'utf8');

    expect(source).toContain('Hydration');
    expect(source).toContain('Open Intake');
    expect(source).not.toContain('Recent fluids');
    expect(source).not.toContain('Log Beverage');
    expect(source).not.toContain('+8 oz');
    expect(source).not.toContain('+12 oz');
    expect(source).not.toContain('+16 oz');
    expect(source).not.toContain('+20 oz');
    expect(source).not.toContain('+24 oz');
    expect(source).not.toContain('+32 oz');
  });
});
