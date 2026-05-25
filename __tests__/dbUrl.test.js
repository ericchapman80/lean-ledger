import { describe, expect, it } from 'vitest';
import { getDatabaseUrl, withPublicSchemaSearchPath } from '../lib/dbUrl';

describe('withPublicSchemaSearchPath', () => {
  it('adds a public search_path option when none exists', () => {
    const url = withPublicSchemaSearchPath('postgresql://user:pass@localhost:5432/app');

    expect(url).toContain('options=');
    expect(decodeURIComponent(url)).toContain('-csearch_path=public');
  });

  it('preserves existing options and appends the public search_path once', () => {
    const url = withPublicSchemaSearchPath(
      'postgresql://user:pass@localhost:5432/app?sslmode=require&options=-cstatement_timeout%3D5000'
    );

    const decoded = decodeURIComponent(url);
    expect(decoded).toContain('-cstatement_timeout=5000');
    expect(decoded).toContain('-csearch_path=public');
    expect(decoded.match(/-csearch_path=public/g)).toHaveLength(1);
  });
});

describe('getDatabaseUrl', () => {
  it('prefers the unpooled connection when one exists', () => {
    const url = getDatabaseUrl({
      DATABASE_URL: 'postgresql://pooled.example/app',
      DATABASE_URL_UNPOOLED: 'postgresql://direct.example/app',
    });

    expect(url).toContain('direct.example');
    expect(decodeURIComponent(url)).toContain('-csearch_path=public');
  });
});
