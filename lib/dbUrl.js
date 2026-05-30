const PUBLIC_SEARCH_PATH_OPTION = '-csearch_path=public';

export function withPublicSchemaSearchPath(databaseUrl) {
  if (!databaseUrl) return databaseUrl;

  const url = new URL(databaseUrl);
  const existingOptions = url.searchParams.get('options');

  if (!existingOptions) {
    url.searchParams.set('options', PUBLIC_SEARCH_PATH_OPTION);
    return url.toString();
  }

  const optionTokens = existingOptions.split(/\s+/).filter(Boolean);
  if (!optionTokens.includes(PUBLIC_SEARCH_PATH_OPTION)) {
    optionTokens.push(PUBLIC_SEARCH_PATH_OPTION);
    url.searchParams.set('options', optionTokens.join(' '));
  }

  return url.toString();
}

export function isNeonPooledUrl(databaseUrl) {
  if (!databaseUrl) return false;

  const url = new URL(databaseUrl);
  const host = url.hostname.toLowerCase();

  return host.includes('neon.tech') && host.includes('pooler');
}

export function getDatabaseUrl(env = process.env) {
  if (env.DATABASE_URL_UNPOOLED) {
    return withPublicSchemaSearchPath(env.DATABASE_URL_UNPOOLED);
  }

  if (!env.DATABASE_URL) return env.DATABASE_URL;

  if (isNeonPooledUrl(env.DATABASE_URL)) {
    return env.DATABASE_URL;
  }

  return withPublicSchemaSearchPath(env.DATABASE_URL);
}
