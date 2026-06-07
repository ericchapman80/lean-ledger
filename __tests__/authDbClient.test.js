import { describe, expect, it } from 'vitest';
import { createAuthAdapterClient } from '@/lib/authDbClient.js';

describe('createAuthAdapterClient', () => {
  it('uses pg for local database urls', () => {
    const client = createAuthAdapterClient({
      DATABASE_URL: 'postgresql://localhost:5432/lean_ledger',
    });

    expect(client.kind).toBe('pg');
    client.pool.end();
  });

  it('uses neon pool for hosted database urls', () => {
    const client = createAuthAdapterClient({
      DATABASE_URL: 'postgresql://user:pass@ep-example.us-east-1.aws.neon.tech/neondb?sslmode=require',
    });

    expect(client.kind).toBe('neon');
    client.pool.end();
  });
});
