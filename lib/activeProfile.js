import { getCurrentUserId } from './auth.js';
import * as Profile from './models/profile.js';
import * as User from './models/user.js';
import { ensurePrimaryProfileForUser } from './models/profileHousehold.js';

// Active-profile seam — V2.2 Family Profiles, Phase 1.
//
// Resolves the profile whose data the current request should read/write. This
// is the single chokepoint the data routes will move onto in Phase 2 (scoping
// by profile_id instead of user_id), so all profile resolution and the future
// household-membership authorization live in one place.
//
// Phase 1 is intentionally behavior-neutral: it returns the current user's
// primary profile (profiles.source_user_id = userId). Migration 016 already
// backfilled one primary profile per user, so for existing data this resolves
// to exactly the row that today's user_id scoping points at. If a user somehow
// has no primary profile (e.g. created after the backfill), we self-heal by
// creating it idempotently rather than failing the request.
//
// Explicit profile switching (a validated `ll_active_profile` cookie checked
// against household membership) layers on in Phase 3, alongside
// POST /api/profiles/:id/activate.
export async function getActiveProfileId(request) {
  const userId = await getCurrentUserId(request);

  const primary = await Profile.findPrimaryByUserId(userId);
  if (primary) return primary.id;

  const user = (await User.findById(userId)) ?? { id: userId };
  const profile = await ensurePrimaryProfileForUser(user);
  return profile?.id ?? null;
}
