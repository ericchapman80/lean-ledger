import postgres from 'postgres';
import { getDatabaseUrl } from './dbUrl';

let _sql;

function getSql() {
  if (_sql) return _sql;
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.');
  }
  // max:1 + short idle keeps connection count sane in serverless (Vercel) where
  // each warm function holds its own pool.
  _sql = postgres(getDatabaseUrl(), { max: 1, idle_timeout: 20 });
  return _sql;
}

// Proxy defers postgres() invocation until first actual query so module-load
// (e.g. Next.js build-time route-handler analysis) doesn't require DATABASE_URL.
// Preserves the full postgres.js surface: `sql\`SELECT ...\``, sql.file, sql.end, etc.
export const sql = new Proxy(function () {}, {
  apply(_target, thisArg, args) {
    return getSql().apply(thisArg, args);
  },
  get(_target, prop) {
    const value = getSql()[prop];
    return typeof value === 'function' ? value.bind(getSql()) : value;
  },
});
