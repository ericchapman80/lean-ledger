import { Pool as NeonPool } from '@neondatabase/serverless';
import { Pool as PgPool } from 'pg';
import { getDatabaseUrl, isLocalDatabaseUrl } from './dbUrl.js';

export function createAuthAdapterClient(env = process.env) {
  const connectionString = getDatabaseUrl(env);
  const isLocal = isLocalDatabaseUrl(connectionString);

  return {
    kind: isLocal ? 'pg' : 'neon',
    pool: isLocal
      ? new PgPool({ connectionString })
      : new NeonPool({ connectionString }),
  };
}
