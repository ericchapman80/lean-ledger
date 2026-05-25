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

export function getDatabaseUrl(env = process.env) {
  return withPublicSchemaSearchPath(env.DATABASE_URL_UNPOOLED || env.DATABASE_URL);
}
