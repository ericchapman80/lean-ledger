export function hasAuthCredentials(env = process.env) {
  return Boolean(
    env.AUTH_SECRET
    && env.AUTH_GOOGLE_ID
    && env.AUTH_GOOGLE_SECRET
    && (env.DATABASE_URL_UNPOOLED || env.DATABASE_URL),
  );
}

export function isAuthEnabled(env = process.env) {
  return env.AUTH_ENABLED === 'true' && hasAuthCredentials(env);
}

export function getAuthMode(env = process.env) {
  if (isAuthEnabled(env)) return 'enabled';
  if (hasAuthCredentials(env)) return 'configured';
  return 'disabled';
}
