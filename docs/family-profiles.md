# Family Profiles (V2.2)

Lean Ledger supports multiple **profiles** in a **household** — e.g. a parent
plus their kids — each with its own meals, beverages, weight, health metrics,
habits, favorites, and (age-appropriate) coaching targets. One account holder
manages the household; you switch which profile you're "viewing as" from the
header.

## Model

- **`households`** — a household, created for each account holder.
- **`household_members`** — links a user to a household with a `role`
  (`owner` / `admin` / `member`). Owners and admins can manage profiles.
- **`profiles`** — one coaching profile per person. Two kinds:
  - **Primary** (`source_user_id` set): mirrors the account holder. Its
    authoritative coaching data lives in the `users` row; editing it goes
    through `/api/profile` (and the Profile page), which keeps `users` in sync.
  - **Dependent** (`source_user_id` NULL, `is_dependent = true`): a child / teen
    / other family member with no login of their own, managed by an adult.

Every user-owned data table (`meals`, `weight_logs`, `water_entries`,
`health_metrics`, `favorite_*`, `habit_definitions`, `daily_habit_logs`) carries
a `profile_id`. All reads and writes are scoped to the **active profile**.

## The active profile

The active profile is resolved per request by `getActiveProfileId` in
`lib/activeProfile.js`:

1. If a validated `ll_active_profile` cookie is present **and** that profile is
   in a household the current user belongs to, use it.
2. Otherwise fall back to the user's **primary** profile.

A stale or forged cookie can never select a profile outside the user's
household — accessibility is re-checked on every request. Switching profiles
(`POST /api/profiles/:id/activate`) validates the same way before writing the
cookie.

`resolveActiveCoachingSubject` returns the coaching subject for the active
profile (the `users` row for the primary, the `profiles` row for a dependent),
which feeds `enrichProfile` — so a switched-to child sees its **own**
age-appropriate, youth-safe targets, not the account holder's.

## API

- `GET /api/profiles` — list the household's profiles (primary first; each
  marked `isActive`).
- `POST /api/profiles` — create a dependent profile (owner/admin only).
- `PUT /api/profiles/:id` — edit a dependent profile (owner/admin only).
- `DELETE /api/profiles/:id` — remove a dependent profile. **A primary profile
  can never be deleted through this path** (`source_user_id IS NULL` guard).
- `POST /api/profiles/:id/activate` — switch the active profile (sets the
  validated cookie).

The household management UI lives at `/household`; the header shows a profile
switcher.

## Data integrity & safety guarantees

- **Per-profile isolation** — a user acting as one profile cannot read, update,
  or delete another profile's rows (covered by real-DB isolation suites in
  `__tests__/integration/` and an end-to-end browser test in
  `tests/e2e/householdProfiles.spec.js`).
- **Cross-household isolation** — profiles, switching, and management are all
  scoped to the caller's household.
- **No primary deletion** — the account holder's own profile is never
  deletable via the profiles API.
- **Youth-safe coaching** — targets and guardrails derive from the active
  profile's date of birth, so minors don't inherit adult deficit targets.

## Single-user mode

With `AUTH_ENABLED=false` the app runs as a single owner (`user_id = 1`); a
household and primary profile are created on demand. Everything above still
applies — there's just one account holder.
