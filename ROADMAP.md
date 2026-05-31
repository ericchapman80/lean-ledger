# Lean Ledger — Roadmap

Future work that isn't part of the initial Next.js + Neon port. Each item below has been scoped well enough to pick up cold later.

---

## Lean Recomp Product Roadmap

### Phase 1 Status

- **Phase 1 is complete.**
- **Completed Lean Recomp foundation**:
  - Lean Recomp goal and diet style persistence
  - dynamic macro recommendations
  - weekly calorie/protein targets
  - core and advanced trend analytics
  - optional smart-scale/body-composition metrics
  - compact Lean Recomp check-in for waist, workouts, hydration, sleep, recovery, and progress photo metadata
  - advanced health kept optional and secondary to the core workflow
- **Phase 1 definition met**:
  - users can run the core Lean Recomp loop with weight, calories, protein, waist, and workouts
  - advanced metrics remain optional
  - onboarding stays focused
  - custom macro behavior remains intact

### Phase 2 Priorities

**Legend**
- ✅ shipped
- 🚧 in progress
- 🧭 next up
- 🕒 later / future iteration

## Meal Intelligence & Behavioral Insights

Meal intelligence should be treated as a **high-priority Phase 2 direction** because it aligns directly with the core Lean Recomp product philosophy:

- **consistency over perfection**
- **low cognitive load**
- **sustainable habits**
- **fast daily logging**
- **behavior reinforcement**
- **meal-first UX**

This roadmap area should clearly guide future product decisions around these principles:

- **meals are now canonical UX objects**
- **meal intelligence is a major future direction**
- **sustainability and consistency remain the primary philosophy**

### 1. Favorite Meals / Meal Templates ✅

- **Status: shipped on main**
  - save favorite meals
  - add favorite meals back to the current day
  - repeat last meal
  - repeat yesterday’s breakfast/lunch/dinner

- **Allow users to**:
  - save reusable meals
  - quickly re-add meals
  - repeat yesterday’s breakfast/lunch/dinner
  - minimize repetitive logging friction
- **Rationale**:
  - Most users repeat meals regularly.
  - Meal reuse dramatically improves speed, consistency, and retention.

### 2. Smart Favorite Meal Detection ✅

- **Status: shipped on main**
  - repeated meal sections are detected from recent intake history
  - duplicate favorite suggestions are suppressed when an equivalent favorite already exists
  - users can save immediately or dismiss the prompt for the selected day

- **Detect repeated meal combinations automatically.**
- **Example**:
  - “You’ve logged this breakfast 5 times. Save as a favorite meal?”
- **Rationale**:
  - Reduces friction and helps users build sustainable routines without manual organization work.

### 3. Meal-Level Macro Feedback ✅

- **Status: shipped on main**

- **Add lightweight meal quality insights.**
- **Examples**:
  - “Great protein anchor”
  - “High-protein breakfast”
  - “Dinner was carb-heavy”
  - “Low-protein meal”
- **Requirements**:
  - keep feedback lightweight
  - avoid shame/punishment tone
  - avoid clutter
- **Rationale**:
  - Meal-level feedback is more actionable and psychologically useful than only daily totals.

### 4. Meal Trends & Behavioral Analytics ✅

- **Status: shipped on main**
  - average breakfast protein
  - snack frequency
  - dinner calorie trends
  - meal timing consistency
  - high-protein meal streaks

- **Track meal-level patterns over time.**
- **Examples**:
  - average breakfast protein
  - snack frequency
  - dinner calorie trends
  - meal timing consistency
  - high-protein meal streaks
- **Rationale**:
  - This supports sustainable behavior change and gives users meaningful insight into eating patterns.

### 5. Repeat & Quick-Add UX ✅

- **Status: shipped foundation on main**
  - repeat last meal
  - repeat yesterday’s breakfast/lunch/dinner
  - add favorite meal
  - add favorite food / add again today
  - add favorite beverage
  - future work remains around even faster frequent-meal shortcuts

- **Improve rapid logging workflows.**
- **Examples**:
  - Repeat Last Meal
  - Repeat Yesterday’s Breakfast
  - Add Favorite Meal
  - Quick Add Frequent Meals
- **Rationale**:
  - Daily logging speed is one of the most important retention drivers.

### 6. Meal Categories & Context 🕒

- **Future-friendly support for**:
  - Pre Workout
  - Post Workout
  - Track Meet
  - Recovery Meal
- **Constraint**:
  - Do not overcomplicate the initial UX.
- **Rationale**:
  - Supports athletic/recovery workflows without requiring a complex nutrition system.

### 7. Meal-Centric Dashboard Direction 🚧

- **Continue evolving the app toward**:
  - meal-first UX
  - meal summaries
  - meal-level trends
  - reduced database/admin-panel feel
- **Rationale**:
  - Users think in meals, not food rows.

### 8. Behavioral Coaching Layer 🕒

- **Future AI/coaching layer should focus on**:
  - consistency
  - protein adherence
  - recovery
  - meal patterns
  - sustainable habits
- **Avoid**:
  - shame
  - punishment
  - obsessive optimization
- **Examples**:
  - “Breakfast protein has improved this week.”
  - “Your dinners trend higher-carb on weekends.”
  - “Consistent lunches correlate with better calorie adherence.”

### 9. Guardrails

- **Avoid overcomplicated meal taxonomies**
- **Avoid nested meal systems**
- **Avoid excessive AI intrusion**
- **Preserve fast mobile logging**
- **Preserve low cognitive load**

## Hydration & Beverage Intelligence

- ✅ shipped on main
  - weighted hydration contribution system
  - internal beverage hydration multipliers
  - beverage favorites
  - beverage trends / hydration behavior insights
  - hydration feedback on Dashboard and Intake
  - custom beverage names for `Other`
  - duplicate prevention for favorite foods and favorite beverages
- 🚧 in progress
  - adaptive hydration targets based on weight, workouts, and diet style

Hydration intelligence should be treated as a **high-priority Phase 2 direction** because it supports the Lean Recomp philosophy without increasing logging friction:

- **low cognitive load**
- **fast logging**
- **mobile-first behavior tracking**
- **lightweight intelligence**
- **consistency over perfection**

### Partial Hydration Contribution System ✅

- **Goal**:
  - Improve hydration realism while preserving a simple, non-technical UX.
- **Background**:
  - Not all beverages contribute equally toward hydration.
  - Water, tea, and electrolyte drinks should count differently than protein shakes, keto coffee, milk, soda, or alcohol.

### Internal Hydration Contribution Multipliers ✅

- **Support configurable internal hydration contribution percentages by beverage type**:
  - Water → 100%
  - Sparkling water → 100%
  - Electrolyte drink → 100%
  - Unsweet tea → 100%
  - Black coffee → 90%
  - Milk → 70%
  - Diet soda → 70%
  - Protein shake → 50%
  - Keto coffee → 40%
  - Alcohol → 0–25%
- **Implementation direction**:
  - Keep these values configurable internally.
  - Do not require users to configure percentages manually.

### Hydration Calculation Behavior ✅

- **Hydration progress should be derived from**:
  - beverage amount
  - hydration contribution multiplier
- **Example**:
  - 16 oz black coffee → ~14.4 oz hydration counted internally

### Preserve Low Cognitive Load ✅

- **Do not expose hydration math everywhere in the UI**
- **Default UX should remain simple**:
  - hydration total
  - target
  - remaining
  - progress

### Optional Hydration Details 🕒

- **Add an optional drill-down for deeper insight**
- **Requirements**:
  - compact UX
  - expandable section, modal, drawer, tooltip, or similar lightweight interaction
  - mobile-first
  - minimal visual clutter
- **Example**:
  - Hydration Details
  - Water → 32 oz counted
  - Black coffee → 14 oz counted from 16 oz
  - Protein shake → 8 oz counted from 16 oz

### UX Philosophy

- **The app should**:
  - educate without overwhelming
  - avoid requiring manual hydration math
  - preserve fast logging
  - avoid dashboard clutter
- **Hydration details should feel**:
  - optional
  - informative
  - compact
  - expandable on demand

### Future Hydration Intelligence 🧭

- **Workout / sweat hydration adjustments**
- **Sauna adjustments**
- **Electrolyte / sodium awareness**
- **Apple Health hydration sync**
- **Wearable-based hydration recommendations**

### Guardrails

- **Preserve existing hydration tracking**
- **Preserve beverage tracking**
- **Preserve beverage logging UX**
- **Preserve quick water add**
- **Preserve Intake-first architecture**
- **Preserve low cognitive load**
- **Prefer internal multipliers and derived totals**
- **Prefer reusable hydration detail components**
- **Prefer expandable UX instead of permanent visible complexity**
- **Avoid exposing complicated hydration formulas everywhere**
- **Avoid cluttering Dashboard or Intake**
- **This should remain a lightweight intelligent enhancement, not a scientific hydration app**

### Product Philosophy

- **Simple**
- **Motivating**
- **Fast**
- **Mobile-first**
- **Sustainable**
- **Consistency over perfection**
- **Core loop should support users who only track weight, calories, protein, waist, and workouts**

### Completed / Implemented

- **Lean Recomp goal** — available in profile, persisted in schema/API/model, and surfaced throughout the app.
- **Diet Style persisted** — Balanced, Low Carb, Keto, and Keto Weekdays / Flexible Weekends are stored and used in macro logic.
- **Dynamic macro recommendations** — Lean Recomp uses dynamic deficit logic, protein-first macro planning, diet-style carbs, and fat as the balancing macro.
- **Weekly targets** — daily and weekly calorie/protein targets, weekly consumed/remaining metrics, and weekly focus summaries exist.
- **Trend analytics** — 7-day average weight trend, previous-week change, protein adherence, weekly calorie budget, keto/flex carb compliance, and consistency score trend exist.
- **Core Lean Recomp check-in fields** — waist, workout completion, hydration, sleep, recovery signals, and progress photo metadata placeholder are persisted through the shared health metric model and surfaced in the dashboard/trends flow.
- **Hydration & beverages as a core behavior layer** — fast water quick-add, beverage-aware hydration tracking, personalized hydration targets, dashboard progress, beverage-derived hydration totals, and hydration trends now exist as a low-friction behavior system.
- **Smart-scale optional fields** — optional body-composition and recovery-style health metric storage exists in the separate `health_metrics` table.
- **Health metrics page/import work** — manual entry, CSV mapping, preview, validation, and import APIs exist for advanced optional metrics.
- **Validation and tests for core check-in fields** — sensible validation ranges and trend analytics coverage exist for the new core Lean Recomp fields.

### In Progress / Needs Follow-up

- **Post-Phase-1 UI polish** — continue tightening spacing, copy, and scanability as real usage reveals friction.
- **Extended workout tracking** — structured strength progression and lift history are still future work.
- **Empty-state refinement** — keep trimming low-value copy as the app grows.

### Missing Core Tracking

- **No major core Lean Recomp data fields are currently missing from the model.**
- **Still intentionally out of scope for core tracking**:
  - actual progress photo uploads and storage
  - structured workout programming / lift history
  - advanced recovery/wearable automation

### Future Integrations

- **Apple Health / HealthKit**
- **Android Health Connect**
- **CSV import improvements**
- **Screenshot OCR import**
- **Smart favorite meal detection**
- **Beverage favorites**
- **Caffeine tracking**
- **Electrolyte tracking**
- **Sweat / workout hydration adjustment**
- **Apple Health hydration sync**
- **Wearable metrics such as steps, sleep, HRV, resting heart rate, workouts**

### Guardrails

- **Do not overload onboarding**
- **Do not clutter dashboard**
- **Advanced metrics must be optional and collapsed**
- **Hide empty advanced charts unless useful**
- **Preserve custom macro behavior**
- **Preserve schema/import/trend architecture**

---

## Multi-Tenancy + Google Auth (highest priority follow-up)

**Goal:** Let multiple users sign in with Google and have their own private macro data.

### Research snapshot (updated 2026-05-27)

Primary docs checked:

- Auth.js Next.js installation: `https://authjs.dev/getting-started/installation?framework=next-js`
- Auth.js Neon adapter: `https://authjs.dev/getting-started/adapters/neon`
- Auth.js Google provider: `https://authjs.dev/getting-started/providers/google`
- Auth.js resource protection/session access: `https://authjs.dev/getting-started/session-management/protecting`
- Auth.js deployment/env vars: `https://authjs.dev/getting-started/deployment`

Current Auth.js guidance uses:

- `next-auth@beta` for Auth.js v5-style Next.js integration.
- A root `auth.js` / `auth.ts` that exports `handlers`, `auth`, `signIn`, and `signOut`.
- `app/api/auth/[...nextauth]/route.js` that re-exports `GET` and `POST` from `handlers`.
- `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET` env var names. `NEXTAUTH_*` still appears in older NextAuth examples, but the current Auth.js docs recommend the `AUTH_*` prefix.
- `AUTH_URL` is usually unnecessary in v5 because the host is inferred from request headers; set it only if inference fails or a custom base path is used.
- On Vercel, `AUTH_TRUST_HOST=true` is usually inferred, but can be set explicitly if redirects or callback host detection behave oddly.
- Next.js 16 renamed `middleware.ts` to `proxy.ts`; this app is currently Next 15, so use `middleware.js` for route protection unless Next is upgraded first.

### Recommended architecture

Use a single canonical `users` table for both Auth.js identity and Lean Ledger profile data.

Why:

- Existing app tables already use `user_id REFERENCES users(id) ON DELETE CASCADE`.
- `getCurrentUserId(request)` is already the user boundary used by API routes.
- Keeping a single `users` table avoids a second app profile table and avoids translating between an Auth.js user id and a separate Lean Ledger profile id on every request.
- Auth.js's Neon adapter expects a `users` table with `id`, `name`, `email`, `emailVerified`, and `image`. Lean Ledger can extend that same table with profile columns.

Target ownership:

- `users`: auth identity plus Lean Ledger profile/onboarding state.
- `accounts`: OAuth provider account linkage, managed by Auth.js.
- `sessions`: database sessions if using database session strategy, managed by Auth.js.
- `verification_token`: required by adapter schema and useful if email/magic-link auth is ever added.
- App data tables remain unchanged: `meals`, `weight_logs`, `water_entries`, `health_metrics`, `favorite_meals`, `favorite_foods`, etc. They continue to scope by `user_id`.

Recommended session strategy:

- Prefer database sessions while using the Neon adapter. This keeps server-side revocation possible and matches the adapter model.
- If serverless connection pressure becomes an issue, reassess JWT sessions later, but database sessions are the simpler initial mental model.

### Code changes

Install dependencies:

```sh
npm install next-auth@beta @auth/neon-adapter
```

`@neondatabase/serverless` is already installed. The Auth.js Neon docs say to create the Neon `Pool` inside the request handler, not at module scope:

```js
// auth.js
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import NeonAdapter from '@auth/neon-adapter';
import { Pool } from '@neondatabase/serverless';

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return {
    adapter: NeonAdapter(pool),
    session: { strategy: 'database' },
    providers: [Google],
  };
});
```

Add:

- `auth.js`
- `app/api/auth/[...nextauth]/route.js`
- `app/login/page.jsx`
- `middleware.js`
- sign-in/sign-out UI in `components/Header.jsx`
- optional small `lib/sessionUser.js` helper if `lib/auth.js` starts doing more than one thing

Update `lib/auth.js#getCurrentUserId(request)`:

```js
import { auth } from '@/auth';

export async function getCurrentUserId() {
  const session = await auth();
  const id = Number(session?.user?.id);
  if (!Number.isInteger(id)) {
    const error = new Error('Unauthenticated');
    error.status = 401;
    throw error;
  }
  return id;
}
```

Also add a route-handler wrapper or `try/catch` pattern so unauthenticated API requests return `401` instead of a generic `500`.

Session shape note:

- Ensure `session.user.id` is present. With Auth.js, this is commonly done in a `session` callback by copying `user.id` onto `session.user.id`.
- Keep `id` numeric if using the existing integer `users.id` primary key.

Profile flow:

- Authenticated user without profile fields should be allowed to reach `/profile`.
- Most other app pages should redirect to `/profile` until required profile fields are completed.
- `/api/profile` should return `404` or a structured `{ needsProfile: true }` for signed-in users with missing profile data.
- After profile save, continue using the existing profile update/create logic, but `createWithId` should not be used for users already created by Auth.js. Instead, update the nullable profile columns on the existing user row.

Route protection:

- `middleware.js` protects pages and redirects unauthenticated users to `/login`.
- API routes still verify the session close to the data access through `getCurrentUserId`; middleware is not enough by itself.
- Allow unauthenticated access to `/login`, `/api/auth/*`, static assets, and possibly `/api/health`.
- Keep post-deploy smoke tests in mind: `/api/health` should remain public, and read-only smoke checks may need an auth-aware mode or a test user session once all other APIs are protected.

### Data migration plan

Current blocker: Lean Ledger's `users` table requires `age`, `height`, `weight`, `gender`, `activity_level`, and `goal` as `NOT NULL`. Auth.js creates a user immediately after OAuth sign-in before the profile form exists, so those profile columns must become nullable.

Recommended migration:

```sql
-- 003_add_authjs_google_multi_tenancy.sql

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS image TEXT;

ALTER TABLE users
  ALTER COLUMN age DROP NOT NULL,
  ALTER COLUMN height DROP NOT NULL,
  ALTER COLUMN weight DROP NOT NULL,
  ALTER COLUMN gender DROP NOT NULL,
  ALTER COLUMN activity_level DROP NOT NULL,
  ALTER COLUMN goal DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique
  ON users(email)
  WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  id_token TEXT,
  scope TEXT,
  session_state TEXT,
  token_type TEXT,
  UNIQUE (provider, "providerAccountId")
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL,
  "sessionToken" VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS verification_token (
  identifier TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL,
  PRIMARY KEY (identifier, token)
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts("userId");
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions("userId");
```

Potential compatibility issue:

- Auth.js Neon adapter documentation shows `verification_token` singular, not `verification_tokens` plural.
- It also shows camel-cased quoted columns like `"userId"`, `"providerAccountId"`, `"sessionToken"`, and `"emailVerified"`. Use the adapter's exact names unless a custom adapter is written.

Existing single-user data migration options:

1. **Claim existing data on first known Google account**: before enabling public sign-in, set `users.email`, `users.name`, and optionally `users."emailVerified"` for `id = 1` to the owner's Google identity. When that account signs in, Auth.js should link or find the existing user by email, then all existing `user_id = 1` data remains owned by that account.
2. **Manual owner migration after first sign-in**: let Auth.js create a new user row, then transactionally update all app tables from `user_id = 1` to the new `users.id`, then delete or archive `users.id = 1`.
3. **Wipe/reset production data**: simplest technically, only acceptable if the existing data is disposable.

Recommended for this app: option 1. It preserves history, keeps foreign keys intact, and avoids rewriting every app table.

### Risk controls and migration runbook

High-risk controls:

- **Data isolation bugs**
  - Add integration tests that create User A and User B, then verify each API only returns the current session user's data.
  - Cover all user-owned tables: `meals`, `weight_logs`, `water_entries`, `health_metrics`, `favorite_meals`, `favorite_meal_items` through parent ownership, and `favorite_foods`.
  - Never accept `userId` from the client. Every route should derive ownership from `getCurrentUserId()`.
  - Keep query methods shaped as `findByUser...`, `remove(id, userId)`, or equivalent.
  - Add a code review checklist item: every query touching user-owned data must filter by `user_id` or join through a user-owned parent.

- **Existing data ownership**
  - Treat the owner account claim as an explicit deployment step, not an assumption.
  - Before enabling sign-in publicly, set `users.email`, `users.name`, and optionally `users."emailVerified"` for `id = 1` to the owner's Google identity.
  - Verify after first sign-in that `accounts."userId"` points to `users.id = 1`.
  - Keep a fallback reassignment SQL script ready in case Auth.js creates a new user row instead of linking to `id = 1`.

- **Profile onboarding mismatch**
  - Make Lean Ledger profile columns nullable in the auth migration.
  - Add a `hasCompletedProfile(user)` helper for required fields: `age`, `height`, `weight`, `gender`, `activityLevel`, and `goal`.
  - Allow incomplete users to access `/profile` and `/api/profile`.
  - Redirect incomplete users from Dashboard, Intake, Weight, Trends, Health, and advanced flows to `/profile`.
  - Keep macro calculations away from incomplete profile rows; return a structured incomplete-profile response instead of throwing.

- **CI/smoke breakage after auth**
  - Keep `/api/health` public.
  - Split smoke tests into public and authenticated modes.
  - For authenticated smoke, seed a dedicated test user/session or add a test-only bypass that is gated by an env var never enabled in production.
  - Update post-deploy checks before merging auth enforcement.

Medium-risk controls:

- **Auth.js schema naming**
  - Use the adapter's exact table/column names: `verification_token`, `"userId"`, `"providerAccountId"`, `"sessionToken"`, and `"emailVerified"`.
  - Do not rename those columns to local snake_case unless also writing a custom adapter.

- **Session/database behavior**
  - Start with database sessions for easier revocation and simpler mental model.
  - Follow the Auth.js Neon pattern of creating the `Pool` inside the request handler.
  - Watch Neon connection metrics after launch; switch to JWT sessions later only if database session overhead becomes a real issue.

- **Route protection gaps**
  - Use `middleware.js` for page redirects.
  - Still enforce auth inside API routes via `getCurrentUserId()`.
  - Standardize unauthenticated API responses as `401`.
  - Only allow unauthenticated access to `/login`, `/api/auth/*`, static assets, and `/api/health`.

- **Email-linking assumptions**
  - Rehearse owner claim in preview using a copied DB.
  - Confirm the signed-in session user id, the `accounts."userId"` value, and visibility of existing meals/weights before production.
  - Do not open sign-in to additional users until owner data is verified.

Lower-risk controls:

- **Rollback complexity**
  - Keep rollback simple: remove route protection and restore `getCurrentUserId()` to `return 1`.
  - Do not immediately drop Auth.js tables during rollback.
  - Leave profile columns nullable unless every row has complete profile data.

- **UX friction**
  - Build `/login` and `/profile` as first-class flows.
  - Show signed-in state and sign-out in the header.
  - After sign-in, route incomplete users directly to `/profile`.
  - After profile save, route to Dashboard.

- **Preview OAuth callback pain**
  - Configure local and production Google OAuth callback URLs first.
  - Use stable Vercel preview URLs only if needed.
  - Keep non-auth preview smoke focused on `/api/health` until authenticated smoke is available.

Database backup and migration plan:

- Back up production with `npm run db:export`.
- Confirm the export file exists and is restorable before touching production.
- Keep Neon native backups/PITR enabled as the second rollback layer.
- Run a row-count snapshot before migration:
  - `users`
  - `meals`
  - `weight_logs`
  - `water_entries`
  - `health_metrics`
  - `favorite_meals`
  - `favorite_meal_items`
  - `favorite_foods`
- Confirm whether any rows exist for users other than `id = 1`.
- Confirm the Google email that should claim existing data.
- Apply the auth migration to preview first.
- In preview, claim `users.id = 1` with the owner email.
- Sign in through Google against preview and verify:
  - session user id resolves to `1`
  - `accounts."userId" = 1`
  - existing meals, weights, beverages, health metrics, and favorites are visible
  - incomplete-profile gating behaves correctly for a brand-new test user
- Only then apply the production migration.
- In production, update `users.id = 1` with the owner email before opening sign-in.
- After production sign-in, repeat the same verification checks.

Owner claim SQL shape:

```sql
UPDATE users
SET
  email = 'owner@example.com',
  name = 'Owner Name',
  "emailVerified" = NOW(),
  updated_at = NOW()
WHERE id = 1;
```

Fallback reassignment SQL shape if Auth.js creates a new owner row:

```sql
BEGIN;

-- Replace 123 with the newly created Auth.js user id.
UPDATE meals SET user_id = 123 WHERE user_id = 1;
UPDATE favorite_meals SET user_id = 123 WHERE user_id = 1;
UPDATE favorite_foods SET user_id = 123 WHERE user_id = 1;
UPDATE weight_logs SET user_id = 123 WHERE user_id = 1;
UPDATE water_entries SET user_id = 123 WHERE user_id = 1;
UPDATE health_metrics SET user_id = 123 WHERE user_id = 1;

COMMIT;
```

Use the fallback only after inspecting `users` and `accounts`; do not run it blindly.

Rollback plan:

- If auth launch fails before new users create data, remove route protection and restore `lib/auth.js` fallback to `return 1`.
- Keep nullable profile columns; reverting those to `NOT NULL` is only safe after every user row has complete profile data.
- Do not drop Auth.js tables immediately; they can remain inert while the app runs single-user again.
- If production data ownership is wrong, prefer a targeted transaction that reassigns affected `user_id` values over broad deletes.
- If the migration corrupts data or ownership in a way that cannot be fixed quickly, restore from the verified `npm run db:export` output or use Neon PITR.

Safest implementation sequence:

1. Add migrations and multi-user isolation tests in preview.
2. Add Auth.js plumbing without enforcing protection everywhere.
3. Claim `users.id = 1` with the owner's Google email.
4. Verify login maps to existing data.
5. Add profile-completion gating.
6. Add API and page protection.
7. Update smoke tests.
8. Deploy production only after a DB export and preview rehearsal.

### Testing plan

Unit/integration:

- `getCurrentUserId` returns the numeric session user id.
- `getCurrentUserId` throws/returns `401` when no session exists.
- `/api/profile` permits authenticated users with incomplete profile.
- App data routes reject unauthenticated requests.
- User A cannot read User B's meals, weights, beverages, health metrics, favorite meals, or favorite foods.

E2E/manual:

- Login page renders and Google sign-in starts.
- First sign-in with no profile redirects to `/profile`.
- Completing profile unlocks dashboard/intake/weight/trends.
- Header shows signed-in user affordance and sign-out.
- Sign-out redirects to `/login` and protected pages are inaccessible.
- Existing owner account sees the previous `id = 1` data after migration.

CI/smoke:

- Keep `/api/health` public for deployment checks.
- Either teach smoke tests to create/use an authenticated test session, or limit post-deploy read-only smoke to public health plus page shell checks until test auth is added.

### Why this is cheap to add later

The schema is already multi-tenant: every per-user table foreign-keys to `users(id)`. The single-user assumption lives only in the application code. During the initial port, every API route handler reads the current user via a single helper:

```js
// lib/auth.js
export async function getCurrentUserId(request) {
  // Today: hardcoded single-user fallback
  // Future: read from session via Auth.js
  return 1;
}
```

To flip the app multi-tenant, change this **one file**. The route handlers don't need to change.

### Recommended stack

**Auth.js (formerly NextAuth)** with the Google provider and Neon adapter.

- Free, self-hosted, the de facto standard for Next.js auth
- Pairs natively with Neon via `@auth/neon-adapter`
- Supports 50+ other providers if we want to add GitHub, email magic links, etc. later
- Considered and rejected: Clerk (adds managed-service dependency), Supabase Auth (only fits if DB is Supabase), DIY Google Identity Services (too much rope)

### Lift estimate: ~3 hours

| Step | Effort | Notes |
|------|--------|-------|
| Create Google Cloud OAuth 2.0 client | 15 min | console.cloud.google.com → APIs & Services → Credentials. Set authorized redirect URI to `https://<vercel-url>/api/auth/callback/google` (and `http://localhost:3000/api/auth/callback/google` for dev). Copy client ID + secret. |
| `npm install next-auth@beta @auth/neon-adapter` | 5 min | `@neondatabase/serverless` is already installed |
| Create `app/api/auth/[...nextauth]/route.js` | 15 min | Configure Google provider, Neon adapter, and database session strategy |
| Add Auth.js schema tables to Neon | 30 min | Add `accounts`, `sessions`, `verification_token`, and Auth.js columns to existing `users`; relax profile columns to nullable for first sign-in onboarding. |
| Update `lib/auth.js#getCurrentUserId()` to read session | 10 min | One-file change; route handlers pick it up automatically |
| Add login page + user menu in header | 60 min | `<button>Sign in with Google</button>`, dropdown with avatar/email/sign-out |
| Add route protection middleware | 30 min | `middleware.js` at root, redirect unauthenticated users to `/login`, gate API routes |
| Adapt existing `users` row to merge with Auth.js's `users` table | 30 min | Profile data lives alongside auth identity. Likely solution: keep one `users` table with all columns, point Auth.js adapter at it. |

### Required env vars (production + local)

```
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
AUTH_SECRET=...  # generate with: npm exec auth secret or openssl rand -base64 33
AUTH_URL=https://lean-ledger.vercel.app  # usually optional in Auth.js v5; set if host inference fails
AUTH_TRUST_HOST=true  # usually inferred on Vercel; useful fallback
DATABASE_URL=...     # already configured for Neon
```

Vercel: set these in Project Settings → Environment Variables. Pull locally with `vercel env pull .env.local`.

### Migration considerations when flipping the switch

- **Existing single-user data:** the seed user (id=1) needs to be claimed by the first Google account that signs in, OR wiped clean. Decide before deploying auth.
- **Profile data shape:** Auth.js's default `users` table has `id`, `name`, `email`, `emailVerified`, `image`. Your app's `users` table adds `age`, `height`, `weight`, `gender`, `activity_level`, `goal`, `units`, `custom_*`. Plan: extend the Auth.js users table with these columns (the adapter accepts a custom schema).
- **First-time onboarding UX:** after Google sign-in, if `age` is null, redirect to `/profile` for the profile completion form.
- **Route protection scope:** API routes should 401 unauthenticated requests; page routes should redirect.

### Out of scope for this milestone

- Other auth providers (GitHub, email magic links) — easy to add later, same Auth.js config
- Account deletion / data export — GDPR-style features, defer
- Multi-tenant data isolation testing — write a test that user A cannot see user B's meals after auth is wired up
- Admin / "view as another user" capabilities — not needed

---

## Other future work

(Stub — add to as we go.)

- **Food database integration** — `FoodSearch.jsx` and `ProductLookup.jsx` components exist in the codebase, partially wired. Likely target: OpenFoodFacts API (free, no key needed) or USDA FoodData Central.
- **Barcode scanning** — `BarcodeScanner.jsx` component exists. Needs camera permission flow + a barcode decoding library (e.g., `@zxing/library`).
  Next priority: move to a dedicated continuous scanner with ZXing or equivalent instead of single-frame capture.
- **Mobile responsiveness pass** — current CSS is desktop-first; needs a real audit on mobile breakpoints.
- **Recipe management** — log a saved recipe as one entry instead of re-entering ingredients.
- **Meal planning** — forward-looking meal plan with target adherence.
- **Micronutrient tracking** — fiber, sugar, sodium, vitamins/minerals.
- **Fitness tracker integration** — pull weight/activity from Apple Health, Google Fit, Whoop, etc.
- **Screenshot import for health metrics** — roadmap placeholder. Helper guidance is already in-app, but OCR-based screenshot import is still coming soon.
- **Apple Health import flow** — roadmap placeholder. Native sync and import UX are still coming soon.
