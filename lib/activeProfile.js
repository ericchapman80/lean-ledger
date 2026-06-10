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
export const ACTIVE_PROFILE_COOKIE = 'll_active_profile';

function readActiveProfileCookie(request) {
  const raw = request?.cookies?.get?.(ACTIVE_PROFILE_COOKIE)?.value;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function getActiveProfileId(request) {
  const userId = await getCurrentUserId(request);

  // Explicit switch: honor a validated cookie. It must point at a profile in a
  // household the current user belongs to — a stale/forged value falls through
  // to the primary profile rather than leaking another household's data.
  const cookieProfileId = readActiveProfileCookie(request);
  if (cookieProfileId != null && (await Profile.isAccessibleToUser(cookieProfileId, userId))) {
    return cookieProfileId;
  }

  const primary = await Profile.findPrimaryByUserId(userId);
  if (primary) return primary.id;

  // Self-heal only when the user row exists. Creating a household references
  // users(id), so attempting it for a not-yet-created user (e.g. single-user
  // mode before the first profile is saved) would violate the FK. Returning
  // null degrades gracefully: profile-scoped reads return nothing rather than
  // erroring, matching pre-V2.2 behavior.
  const user = await User.findById(userId);
  if (!user) return null;

  const profile = await ensurePrimaryProfileForUser(user);
  return profile?.id ?? null;
}
