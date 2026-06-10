# Lean Ledger — Roadmap

Future work that isn't part of the initial Next.js + Neon port. Each item below has been scoped well enough to pick up cold later.

---

## What's next (prioritized — updated 2026-06-09)

1. **V2.2 Family Profiles — application layer** 🧭 — the schema + model foundation shipped (PR #42) but nothing in `app/` uses it; the `profile_id` columns are dead weight until wired up. Highest leverage: finishing this unlocks the family/household use case and makes the just-landed migration pay off. Phased plan under the **V2.2 Family Profiles** rollout section.
2. **Food database integration** — `FoodSearch.jsx` / `ProductLookup.jsx` are partially wired; target OpenFoodFacts (no key) or USDA FoodData Central. High daily-logging value.
3. **Continuous barcode scanning** — move `BarcodeScanner.jsx` from single-frame capture to a continuous scanner (ZXing or equivalent).
4. **Mobile responsiveness pass** — current CSS is desktop-first; needs a real breakpoint audit.
5. **CI/CD pipeline review** — speed the pipeline up via parallelism/caching **without dropping any quality gate** (quality > speed). Quick win: a path filter so docs-only changes skip the heavy pipeline. Full scope under the **CI/CD Pipeline Review** section.
6. **Multi-user isolation E2E hardening** — extend Profile A vs Profile B / User A vs User B isolation coverage across more end-to-end flows (pairs naturally with V2.2 Phase 2).
7. **V2.3 Performance Extensions** 🕒 — event/lift metrics and readiness interpretation; explicitly after the family-profile layer.

---

## Lean Recomp Product Roadmap

### Phase 1 Status ✅

- **Status: complete**
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

**Current status snapshot** (updated 2026-06-09)
- ✅ Meal intelligence foundation is shipped on `main`
- ✅ Hydration and beverage intelligence foundation is shipped on `main`
- ✅ Daily Wins foundation, configurability, templates, and challenge progress are shipped on `main`
- ✅ Multi-tenant auth and invite-only member access foundation are shipped on `main`
- ✅ Lean Ledger 2.0 guided onboarding foundation is shipped on `main`
- ✅ V2.1 youth safety guardrails + athlete day-type context are shipped on `main` (PR #41)
- 🚧 V2.2 Family Profiles: household/profile schema + model foundation shipped (PR #42); the application layer is not built yet
- 🧭 Next product slice: **V2.2 Family Profiles — application layer** (wire the foundation into API, profile-scoped data, and switcher/management UI)

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

### 8. Behavioral Coaching Layer 🚧

- **Status: in progress**
  - meal-level feedback is shipped
  - hydration feedback is shipped
  - recovery / workout behavior insights are shipped
  - the remaining work is deeper cross-signal coaching and more context-aware recommendations

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
  - adaptive hydration targets based on weight, workouts, and diet style
  - custom beverage names for `Other`
  - duplicate prevention for favorite foods and favorite beverages
- 🕒 later / future iteration
  - workout / sweat adjustments
  - sauna adjustments
  - Apple Health hydration sync

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

### Future Hydration Intelligence 🕒

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

## Configurable Daily Wins / Challenge Habits

**Priority**
- High future iteration after current nutrition/date/unit/database stabilization work.

**Goal**
- Allow users to choose which daily habits they want to track so Lean Ledger can support Lean Recomp, recovery, faith/spiritual focus, reading, and challenge-style programs such as 75 Hard without becoming a rigid habit tracker.

**Product philosophy**
- consistency over perfection
- configurable but not overwhelming
- tap-first mobile logging
- supportive, not shame-based
- Intake remains the daily action surface
- Dashboard remains summary-only
- Trends show patterns over time

**Core idea**
- Users should be able to activate a personalized set of Daily Wins from Profile/Settings.
- Only selected habits appear on the Intake page.
- Daily Wins should be opt-in by default: new users start with zero active habits until they configure them.

**Phased implementation plan**

### V1 — Fixed Daily Wins MVP ✅

- **Status: shipped on main**

**Goal**
- Prove that Intake-first habit capture is valuable before introducing full configurability.

**Scope**
- Add a compact `Today’s Wins` card on Intake.
- Start with a fixed curated set of habits:
  - Workout completed
  - Sleep hours
  - Reading completed
  - Prayer / Spiritual focus
  - Energy
  - Soreness
- Use fast tap-first controls:
  - boolean habits: `Done / Not Yet`
  - numeric habits: simple entry or chips
  - rating habits: `1–5` pills
- Add a compact Dashboard summary only:
  - `4 of 6 wins complete`
  - or `Daily Wins: 67%`
- Add basic Trends support:
  - weekly completion %
  - workout consistency
  - sleep trend
  - simple recovery trend

**Why first**
- solves capture friction before adding customization
- keeps scope tight
- validates whether users actually use the Daily Wins surface

**Explicitly out of V1**
- custom habits
- templates
- reorderable habits
- advanced correlation analytics
- challenge history

### V1.5 — Configurable Suggested Habits ✅

- **Status: shipped on main**

**Goal**
- Let users tailor Daily Wins without opening the door to fully open-ended habit tracking yet.

**Scope**
- Add a `Daily Wins` section to Profile / Settings where users can:
  - enable/disable suggested habits
  - reorder active habits
- Expand the suggested habit library to include:
  - Water goal hit
  - Protein goal hit
  - Steps / walk
  - Mobility / stretching
  - Sauna / recovery
  - No alcohol
  - Progress photo
  - Weigh-in
  - Waist measurement
- Only active habits appear on Intake.
- Keep Dashboard summary-only.
- Expand Trends modestly:
  - reading/prayer consistency
  - water/protein habit completion %

**Why second**
- adds personalization without forcing schema or UX complexity too early
- keeps the system opinionated and product-shaped

### V2 — Custom Habits + Challenge Templates 🚧

- **Status: foundation shipped on main**
  - custom boolean Daily Wins habits are shipped
  - challenge templates are shipped
  - challenge progress UX is shipped across Profile, Intake, Dashboard, and Trends
  - richer input types, deeper habit analytics, and more advanced challenge logic remain future work

**Goal**
- Support challenge-style tracking and personal discipline systems without turning Lean Ledger into a generic habit tracker.

**Scope**
- Allow users to add up to 10 custom habits.
- Support challenge templates such as:
  - Lean Recomp Foundations
  - 75 Hard Inspired
  - Recovery Focus
  - Faith + Fitness
  - Minimalist 3-Habit Reset
- Templates should preselect habits but remain customizable.
- Add richer Trends support:
  - correlation with protein adherence, energy, hunger, soreness
  - challenge completion history
- Gradually add more input types:
  - duration minutes
  - measurement
  - text note

**Why third**
- this is where complexity starts to rise
- it should come only after the base capture loop is proven and polished

### Future UX target

- Profile / Settings should eventually provide a `Daily Wins` configuration area for:
  - choosing suggested habits
  - enabling/disabling habits
  - reordering active habits
  - adding custom habits
  - selecting challenge templates

- Intake remains the primary logging surface.
- Dashboard remains a compact summary surface.
- Trends should stay pattern-focused rather than overly analytical until capture friction is low.

**Recommended data model**

- Do **not** implement custom habits as fixed database columns.
- Use a flexible habit definition/log model instead.

### Suggested tables

`habit_definitions`
- `id`
- `user_id` nullable
- `name`
- `category`
- `input_type`
- `default_goal`
- `unit`
- `is_system_default`
- `is_active`
- `sort_order`
- `created_at`
- `updated_at`

`daily_habit_logs`
- `id`
- `user_id`
- `habit_id`
- `date`
- `value_numeric`
- `value_text`
- `value_boolean`
- `completed`
- `note` optional
- `created_at`
- `updated_at`

### Optional future table

`challenge_templates`
- `id`
- `name`
- `description`
- `default_duration_days`
- `is_system_default`

`challenge_template_habits`
- `template_id`
- `habit_definition_id`

**Why not columns**

- Avoid columns like:
  - `custom_habit_1`
  - `custom_habit_2`
  - `custom_habit_3`

- That approach becomes hard to maintain, hard to query, hard to trend, and hard to customize.

**Input types to support eventually**
- boolean
- number
- rating_1_to_5
- duration_minutes
- measurement
- text_note

**V1 recommendation**
- Start with fixed suggested habits plus custom boolean habits.
- Add numeric/rating/duration support incrementally.

**MVP scope**
- Profile configuration for active habits
- up to 10 custom habits
- Today’s Wins card on Intake
- daily completion logging
- compact Dashboard summary
- basic Trends completion %
- tests for habit definition and logging

**Out of scope for MVP**
- fully custom formulas
- complex challenge rules
- penalties
- social sharing
- leaderboards
- AI-generated habit plans
- shame-based streaks

**Guardrails**
- Do not turn Lean Ledger into a generic habit tracker.
- Do not overload Intake.
- Do not require users to configure habits before using the app.
- Do not show inactive habits.
- Do not punish missed days.
- Do not use aggressive 75 Hard language by default.
- Keep Lean Recomp and consistency as the core product identity.

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

## Multi-Tenancy + Google Auth ✅

**Current status**
- Auth.js + Google auth groundwork is shipped on `main`
- local, preview, and production owner-claim rehearsals were completed successfully
- production Google sign-in is live and linked to the existing owner row without data loss
- `Profile` and `Account` UX have been consolidated
- friendly session-expired handling is shipped
- invite-only member access control and admin invite management are shipped on `main`

**Remaining follow-up**
- stronger multi-user isolation coverage across more end-to-end flows
- request-access / approval queue as an alternative to pure pre-invite
- account deletion / export flows
- family profile / household layer on top of member access — 🚧 data foundation shipped (PR #42); application layer tracked under **V2.2 Family Profiles**

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

### Next Slice: Admin-Controlled Member Access

**Goal:** Let the owner/admin explicitly grant access to additional emails, so multi-tenancy stays private by default and does not create surprise accounts on first Google sign-in.

**Problem to solve**

- Auth now works for the owner, but there is no administration layer yet.
- If the app stays open-signup, any Google user could potentially create a Lean Ledger account once auth is enabled.
- The owner needs a clear way to invite a family member such as a son, set their role, and revoke access later.

**Recommended V1 behavior**

- Default posture: **allow-list only**
- First production owner remains `users.id = 1`
- Only approved emails can complete first sign-in
- Approved users become `member` by default
- Admin users can:
  - invite an email
  - see pending vs accepted access
  - revoke access
  - promote/demote role between `admin` and `member`

**Recommended schema**

Add role directly to `users`:

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member'
  CHECK (role IN ('admin', 'member'));
```

Add an allow-list / invitation table:

```sql
CREATE TABLE IF NOT EXISTS allowed_emails (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('admin', 'member')),
  invited_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  UNIQUE (LOWER(email))
);
```

Optional audit table for later, not MVP:

```sql
CREATE TABLE IF NOT EXISTS access_audit_log (
  id SERIAL PRIMARY KEY,
  actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  target_email VARCHAR(255) NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Why this shape**

- `users.role` keeps authorization checks simple after sign-in.
- `allowed_emails` controls who is allowed to onboard in the first place.
- This avoids trying to infer membership purely from existing `users` rows.
- It also keeps “invite” and “active user” as distinct concepts, which is cleaner for revocation and pending states.

**First-login rule**

During Google sign-in:

1. normalize the Google email to lowercase
2. look up a non-revoked row in `allowed_emails`
3. if not found:
   - deny access
   - show a friendly `Access not yet granted` page
4. if found and the user does not exist:
   - allow Auth.js user creation
5. if found and the user exists:
   - allow account linking/sign-in
6. after successful first sign-in:
   - set `allowed_emails.accepted_at` if null
   - set `users.role` from the invitation row

**Owner bootstrap**

- Seed `users.id = 1` as `admin`
- Seed `allowed_emails` with `ericchapman80@gmail.com` as `admin`
- Do not rely on the owner row alone; keep the owner email explicitly allow-listed too

**Admin UI recommendation**

Add a new Profile subsection later:

- `Profile > Account & Access > Members`

V1 actions:

- invite email
- choose role: `member` or `admin`
- view:
  - accepted members
  - pending invites
  - revoked invites
- revoke access

Do **not** start with:

- organizations
- teams
- household sharing
- impersonation
- invite emails actually sent by the app

For MVP, entering an email in the admin UI is enough. The invited user can then sign in with Google using that address.

**Recommended API surface**

- `GET /api/access/members`
- `POST /api/access/members`
- `PUT /api/access/members/:id`
- `DELETE /api/access/members/:id`

Rules:

- admin-only
- never trust role/email changes from non-admin users
- every handler derives the actor from the current session

**Authorization rules**

- `admin`
  - can manage allowed emails and roles
  - can view member access state
- `member`
  - can only access their own Lean Ledger data
  - cannot invite or revoke other users

**Suggested rollout plan**

### V1 ✅

- shipped on `main`

- add `users.role`
- add `allowed_emails`
- bootstrap owner as admin
- block sign-in for emails not on allow-list
- add minimal admin management UI in Profile

### V1.5 🕒

- add accepted/pending/revoked filters
- add access audit logging
- add clearer member onboarding copy

### V2 🕒

- optional invite emails
- household/team concepts if the product later needs shared structures

**Guardrails**

- Do not open self-service sign-up by default.
- Do not allow members to see any other user’s data.
- Do not overload the first admin UI with organization concepts.
- Do not send app-generated invite emails until the core access rules are proven.
- Keep “private nutrition ledger” as the product default.

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

## Lean Ledger 2.0: Age-Aware Coaching and Athlete Profiles 🚧

**Current status**
- `V2.0 foundation` is shipped on `main`
  - guided onboarding-style profile flow
  - `date_of_birth`
  - derived age group
  - `goal_strategy`
  - multi-select `activity_focus`
  - derived `coaching_mode`
- `V2.1 Youth Safety + Athlete Context` is shipped on `main` (PR #41)
  - youth safety guardrails in `lib/coachingProfile.js` (under-13 and under-18 messaging/guardrails)
  - `day_type` context (migration `015_add_day_type_to_health_metrics`) surfaced on dashboard, intake, and profile
  - athlete day-type recovery/hydration/sleep framing
- `V2.2 Family Profiles` **data foundation** is shipped on `main` (PR #42), but the **application layer is not built yet**
  - shipped: `households`, `household_members`, `profiles` tables (migration `016_add_household_profile_foundation`), a `profile_id` FK on all 9 user-owned data tables (backfilled), and the idempotent `lib/models/profileHousehold.js` helpers (`ensureDefaultHouseholdForUser`, `ensurePrimaryProfileForUser`)
  - not built: nothing in `app/` calls these helpers, there are no profile/household API routes, no profile switching, and data is still scoped by `user_id` — the `profile_id` columns are currently dead weight

**Recommended next slice**
- `V2.2 Family Profiles — application layer` (see the phased plan under the V2.2 rollout section below)

**Vision**

Lean Ledger should evolve from a nutrition tracker into a personalized coaching platform that adapts recommendations based on age, goals, activity focus, day type, and family context.

The key change in 2.0 is that onboarding becomes more of a guided interview instead of a simple profile form. New users should be led through a short sequence that establishes:

- who this profile is for
- age band
- coaching intent
- activity focus
- current routine
- household context

That interview should drive the product model automatically rather than asking users to understand internal modes like “kid mode” or “athlete mode.”

### 2.0 Onboarding Direction: Guided Interview

**Goal:** Replace the current “fill out your profile” setup with a friendlier first-visit flow that derives the correct coaching posture automatically.

**Recommended interview flow**

1. Who is this profile for?
   - Me
   - My child / teen
   - Another family member

2. Date of birth
   - required
   - used to derive age group automatically

3. What are you working toward right now?
   - Fat Loss
   - Lean Recomp
   - Maintenance
   - Lean Mass Gain
   - Performance Fueling
   - Confidence + Fitness

4. What activities matter most right now?
   - multi-select from the supported activity list

5. What kind of days do you typically have?
   - practice / workout / recovery / rest context

6. Optional household context
   - parent/admin is creating another family member profile

**Why interview-style onboarding**

- reduces configuration anxiety
- hides internal product complexity
- supports youth/family use cases more naturally
- creates cleaner derived coaching modes than a flat settings page

### Age-Aware Profiles

Add required `date_of_birth` to profile configuration.

Derive automatically:

- `Child` `<13`
- `Teen` `13-17`
- `Adult` `18+`

Do **not** require users to manually enable a kid mode.

The application should automatically adapt:

- nutrition targets
- coaching language
- available goal strategies
- warnings / safety rails
- day-type recommendations
- dashboard emphasis

### Derived Coaching Modes

Introduce a derived `coaching_mode` rather than asking users to choose one directly.

Initial modes:

- Weight Management
- General Wellness
- Youth Wellness
- Youth Athlete
- Athlete Performance
- Lean Mass Gain

Derived from:

- age group
- goal strategy
- activity focus

Examples:

- adult + fat loss + general fitness => `Weight Management`
- teen + football / track => `Youth Athlete`
- adult + performance fueling + strength / track => `Athlete Performance`
- child + confidence + fitness => `Youth Wellness`

### Goal Strategy

Replace the current simple goal selection with:

- Fat Loss
- Lean Recomp
- Maintenance
- Lean Mass Gain
- Performance Fueling
- Confidence + Fitness

Notes:

- `Confidence + Fitness` is especially important for youth and family-friendly use
- under-18 profiles should not be nudged toward aggressive body-composition goals
- current Lean Recomp work remains valid, but should become one branch of a broader coaching system

### Activity Focus

Support multi-select activity focus:

- Football
- Track & Field
- Strength Training
- General Fitness
- Walking
- Mobility / Recovery
- None

This should influence:

- coaching mode derivation
- hydration emphasis
- protein guidance
- recovery prompts
- day-type logic

### Day Type

Add daily context that can shape targets and coaching:

- Workout Day
- Practice Day
- Competition / Game Day
- Recovery Day
- Rest Day

Day type should adjust:

- hydration target
- fueling emphasis
- recovery messaging
- Daily Wins prompts
- athlete-specific check-ins

### Youth Safety Guardrails

For profiles under age 18:

- prohibit aggressive calorie deficits
- prohibit unsafe weight-loss targets
- avoid body-shaming language
- avoid appearance-focused coaching
- emphasize:
  - strength
  - energy
  - recovery
  - participation
  - confidence
  - healthy habits

For profiles under age 13:

- do not display calorie deficit recommendations
- do not display weight-loss coaching
- do not emphasize scale-driven body change
- emphasize:
  - movement days
  - hydration
  - sleep
  - active play
  - participation
  - confidence building

### Youth Athlete Features

Support youth athletes such as football, track, and strength-training participants.

Core features:

- recovery score
- hydration score
- sleep tracking
- soreness tracking
- energy tracking
- workout completion tracking

These should be framed as:

- readiness
- recovery
- consistency
- support

not aesthetic optimization.

### Future Athlete Performance Metrics

Roadmap item for later athlete-performance expansion:

- bench press
- squat
- deadlift
- vertical jump
- sprint times
- throwing marks
- event-specific performance indicators

These should come **after** the age-aware coaching layer, not before it.

### Family Profiles

Support multiple profiles per household, for example:

- Parent
- Teen Athlete
- Child Wellness

Each profile should maintain its own:

- goals
- activity focus
- coaching mode
- daily wins
- nutrition targets
- progress history

while sharing a common family account / admin owner.

This should build on the new member-access foundation, but it is **not** just generic multi-tenancy:

- household membership should be intentionally linked
- parent/admin should be able to create/manage child profiles
- profile switching must be explicit and safe

### Recommended Data Model Direction

**Do not** overload the current `users` table with every future family/profile concept.

Recommended direction:

- keep `users` as auth identities
- introduce a separate `profiles` or `coaching_profiles` table later for:
  - date of birth
  - age group
  - goal strategy
  - activity focus
  - coaching mode
  - family role / profile label

Likely future structure:

`users`
- auth identity
- role / admin capabilities

`profiles`
- one or more coaching profiles owned by a user or household admin
- domain-specific health / coaching state

`profile_activity_focus`
- join table for multi-select activity focus

`profile_day_context`
- per-day type selection / derivation

`households` or `family_accounts`
- future optional grouping model

This avoids forcing “one auth user = one coaching profile” forever.

### Suggested Rollout Plan

#### V2.0 Foundation ✅

- shipped foundation on `main`

- add DOB
- derive age group
- introduce goal strategy
- introduce activity focus
- introduce derived coaching mode
- add guided onboarding interview

#### V2.1 Youth Safety + Athlete Context ✅

- shipped on `main` (PR #41)
- apply youth safety guardrails
- add day type
- add athlete-focused recovery/hydration/sleep logic
- adjust dashboard and Daily Wins prompts by coaching mode

#### V2.2 Family Profiles 🚧

**Data foundation ✅ (PR #42)** — `households`, `household_members`, `profiles` tables; `profile_id` FK on all 9 user-owned data tables (backfilled); idempotent `ensureDefaultHouseholdForUser` / `ensurePrimaryProfileForUser` helpers.

**Application layer 🧭 (next up)** — wire the foundation into the running app. The core architectural change is moving the per-request data boundary from "current user" to "current *active profile*", scoped to a household the user belongs to. Phased so the risky data-scoping change lands behind tests, one concern per PR.

Goal: support multiple profiles per household, let a parent/admin create and manage child/teen profiles, and switch profiles explicitly and safely.

##### Phase 1 — Wire in the foundation + active-profile seam (no behavior change)
- Call `ensurePrimaryProfileForUser` on sign-in (Auth.js `signIn` event) and during owner bootstrap so every existing/new user has a household + primary profile.
- Add `lib/models/profile.js` read helpers (`findById`, `findByHousehold`, `findManagedBy`, `findActiveForUser`).
- Add a `getActiveProfileId(request)` seam in `lib/auth.js` that resolves the active profile from a signed/validated cookie (`ll_active_profile`), falling back to the user's primary profile (`profiles.source_user_id = userId`). The cookie value is re-validated against household membership on every request — never trusted from the client.
- No data route changes yet → zero behavior change. Pure plumbing + unit tests.

##### Phase 2 — Profile-scoped data access (the risky core)
- Switch data routes/models to scope reads and writes by `profile_id` (derived from `getActiveProfileId`) instead of `user_id`. Keep `user_id` on rows for ownership; add `profile_id` to all new INSERTs.
- Authorization: the active profile must belong to a household the current user is a member of; dependent (child/teen) profiles must be `managed_by_user_id = currentUser` or owner/admin of the household.
- Do this table-by-table (`meals`, `weight_logs`, `water_entries`, `health_metrics`, `favorite_*`, `habit_definitions`, `daily_habit_logs`) with **profile-isolation tests** mirroring the existing multi-tenant user-isolation tests: Profile A cannot read/write Profile B's rows.

**Risk assessment (Phase 2 is the only high-risk phase).** The headline risk is cross-profile data leakage — sensitive because it can involve children's data. It is mitigatable, and the risk profile is favorable:
- *Most irreversible risk is already paid.* Migration 016 already backfilled `profile_id` on every existing row and created one primary profile per user, so for today's one-human-per-household reality, "scope by `profile_id`" is behaviorally identical to "scope by `user_id`" — low regression risk for current users.
- *The team has executed this exact shape before.* Multi-tenant auth introduced the same class of risk (User A vs User B) and was landed safely via a single seam (`getCurrentUserId`) plus isolation tests. Profile scoping reuses that playbook with one new seam (`getActiveProfileId`).
- *Single chokepoint + gated tests.* All scoping flows through `getActiveProfileId`; the active profile is validated against household membership server-side every request; profile-isolation tests are a **required** gate before each table flips.
- *Defense in depth during transition.* Keep the `user_id` filter alongside the new `profile_id` filter so a profile-id bug still cannot cross a household boundary.
- *Phasing contains blast radius.* Phase 1 changes nothing observable; Phase 2 flips one table at a time, each behind its own isolation test.

**Reward vs. risk.** The schema/backfill cost (the expensive, hard-to-reverse part) is already merged and is otherwise dead weight; finishing realizes that investment and unlocks the family/household use case central to the 2.0 vision. The key product question that should gate Phase 2+: *how common is the multi-profile/family case?* If families are core (the stated 2.0 direction), the reward clearly justifies the contained, mitigatable risk. If one-human-one-profile dominates in practice, Phase 1 can land (harmless) and Phase 2+ can be deferred, leaving the columns dormant rather than removing them.

##### Phase 3 — Profile management API (admin/owner gated)
- `GET /api/profiles` — list profiles in the caller's household.
- `POST /api/profiles` — create a dependent (child/teen) profile; owner/admin only; reuse `validateProfilePayload` + youth-safety derivation from DOB.
- `PUT /api/profiles/:id` — edit a profile the caller manages.
- `DELETE /api/profiles/:id` — remove a dependent profile; never the primary/source profile.
- `POST /api/profiles/:id/activate` — set the active profile (writes the validated cookie).
- Rules: never trust `profileId`/role/email from the client; every handler derives the actor from the session.

##### Phase 4 — Switcher + management UI
- Profile switcher in the header (current profile name/avatar → household profile list → switch).
- `Profile > Account & Access > Household` section: list profiles, add child/teen (reuse the guided-interview "Who is this profile for?" flow), edit, remove.
- Youth-safety guardrails (already in `lib/coachingProfile.js`) apply per profile automatically from each profile's DOB.

##### Phase 5 — Isolation E2E, polish, docs
- E2E: create a child profile → switch → confirm data isolation between profiles → switch back.
- Update auth-aware smoke/e2e checks if the active-profile cookie affects unauthenticated paths.
- Document the household/profile model and switching in `README.md` / `docs/`.

**Guardrails (carry over):** household membership must be intentional (not generic multi-tenancy); profile switching must be explicit and safe; keep `user_id` as the ownership/auth anchor and `profile_id` as the data-scope key; do not expose other households' data; preserve low-friction logging.

#### V2.3 Performance Extensions 🕒

- event/lift metrics
- trend and readiness interpretation
- athlete-performance summaries

### Guardrails

- Do not introduce “kid mode” as a manual toggle.
- Do not show unsafe youth deficit or weight-loss guidance.
- Do not let performance features override recovery and health guardrails.
- Do not force adult-style body-composition language into youth flows.
- Do not make the onboarding interview long or clinical.
- Keep recommendations supportive, plain-language, and coach-like.

### Product Positioning Outcome

If done well, Lean Ledger 2.0 becomes:

- useful for adults pursuing fat loss, recomp, and performance
- safe and supportive for kids and teens
- relevant for athletes
- manageable for families

without turning into a generic calorie tracker or a generic habit app.

## CI/CD Pipeline Review

**Goal:** make the pipeline faster to iterate on **without weakening any quality gate**. Quality is the priority; speed is the optimization. No gate (tests, coverage, build, audit, smoke, e2e, deployed checks) may be removed or downgraded — only re-orchestrated, parallelized, or cached.

**Current shape (for reference)**
- PR path: `validate` → `local-functional` → `deploy-preview` → `preview-post-deploy`
- main path: `validate` → `local-functional` → `deploy-production` → `production-post-deploy`
- `validate` and `local-functional` both `npm ci`, both spin up Postgres, and both run `npm run build`; deploy jobs build again via `vercel build`. There is meaningful duplicated work.

**Candidate speedups (all preserve gates)**
- **Parallelize independent gates.** `validate` (vitest + coverage + build + audit) and `local-functional` (smoke + e2e against a locally built app) are independent quality gates run sequentially. Running them in parallel trades fast-fail for wall-clock; both still run. Evaluate the fast-fail tradeoff.
- **Cache aggressively.** `actions/cache` for `.next/cache` (Next build), Playwright browsers (`~/.cache/ms-playwright`), and confirm npm cache is effective. Browser install + rebuilds are large, repeated costs.
- **De-duplicate the build.** Build once, share the artifact across jobs that need it instead of building 3–4 times per run.
- **Shard the slow suites.** Vitest and Playwright both support sharding via a matrix; fan out long suites and join on a gate job. More gates run in parallel, same coverage.
- **Split `npm audit`** into its own parallel job so a security gate doesn't serialize behind the build.
- **Path filters (quick win, do first).** Skip the heavy pipeline on docs-only changes (`**.md`, `docs/**`, `ROADMAP.md`). Design note: if these Pipeline checks are/become *required* for merge, a plain `paths-ignore` will block docs PRs (the required check never reports). Use the "skip-but-report-success" pattern — a lightweight gate job that always runs and reports success when only docs changed — so required-check branch protection still passes. (This very PR is a docs-only change that ran the full pipeline; the filter prevents that going forward.)

**Guardrails**
- Keep every existing gate required and blocking.
- Prefer orchestration/caching changes over changing what is tested.
- Measure before/after wall-clock; don't add complexity that doesn't pay for itself.
- Deployed-environment checks (preview/production post-deploy) stay as real gates; do not stub them to save time.

**Suggested sequence**
1. Path filter for docs-only changes (quick win).
2. Add caching (`.next/cache`, Playwright browsers).
3. Parallelize `validate`/`local-functional` and split out `npm audit`.
4. Shard vitest/Playwright if wall-clock still dominates.
5. Measure and document the before/after.

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
