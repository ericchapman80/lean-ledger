const USER_OWNED_TABLES = [
  'meals',
  'favorite_meals',
  'favorite_foods',
  'favorite_beverages',
  'weight_logs',
  'water_entries',
  'health_metrics',
  'habit_definitions',
  'daily_habit_logs',
];

export function normalizeOwnerClaimInput(input = {}) {
  const email = input.email?.trim().toLowerCase();
  const name = input.name?.trim() || null;
  const userId = Number(input.userId ?? 1);
  const verifyEmail = input.verifyEmail !== false;

  if (!email) {
    throw new Error('AUTH_OWNER_EMAIL is required.');
  }

  if (!Number.isInteger(userId) || userId < 1) {
    throw new Error('AUTH_OWNER_USER_ID must be a positive integer.');
  }

  return {
    userId,
    email,
    name,
    verifyEmail,
  };
}

export function getUserOwnedTables() {
  return [...USER_OWNED_TABLES];
}

export function summarizeOwnerClaimState({
  ownerUser = null,
  conflictingUser = null,
  accounts = [],
  counts = {},
}) {
  return {
    ownerUserId: ownerUser?.id ?? null,
    ownerEmail: ownerUser?.email ?? null,
    ownerName: ownerUser?.name ?? null,
    ownerEmailVerified: ownerUser?.emailVerified ?? null,
    conflictingUserId: conflictingUser?.id ?? null,
    linkedAccountUserIds: accounts.map((account) => account.userId),
    tableCounts: counts,
  };
}
