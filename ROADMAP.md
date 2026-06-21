# Lean Ledger — Roadmap

Future work that isn't part of the initial Next.js + Neon port. Each item below has been scoped well enough to pick up cold later.

---

## What's next (prioritized — updated 2026-06-21)

1. ✅ **V2.2 Family Profiles — shipped end to end** (foundation + Phases 1–5, PRs #42, #48–#56). Households, dependent profiles, switching, per-profile data isolation, and youth-safe per-profile coaching are live. See [`docs/family-profiles.md`](docs/family-profiles.md).
2. ✅ **Application UX / quality-of-life cleanup** — replaced all `alert()`/`confirm()` with toast + optimistic-undo, Modal focus-trap a11y, Dashboard check-in moved to Intake deep-link (PR #59).
3. ✅ **Theming (light / dark / system)** — CSS token system + `next-themes`, System / Light / Dark toggle in Profile > Appearance (PR #59).
4. ✅ **Food database integration** — `GET /api/food-search` with merged OpenFoodFacts + USDA search, server-side only, `use_count` auto-favorite suggestion at count=2 (PR #64, follow-up search ranking patch on trunk).
5. ✅ **CI/CD pipeline review** — docs path filter (PR #60), Next.js + Playwright caching, parallel `validate`/`local-functional`, `security-audit`, `workflow-lint` with actionlint, `quality-gate` join (PR #62), CodeQL SAST + branch protection (PR #63).
6. ✅ **Google Auth** — multi-tenant auth, invite-only member access, and Google OAuth are live in production.
7. **Mobile responsiveness pass** — PR #65 shipped: bottom-sheet modal, landscape revert to centered dialog, `.btn-group .btn` full-width scoping, `.table-scroll` / `.inline-actions` utilities, 48 px touch targets, meals action-row wrapping. A full per-page breakpoint audit is still needed before this can be marked complete.
8. ✅ **Multi-user isolation E2E hardening** — profile/weight cross-profile corruption prevention and owner-profile isolation E2E shipped (PRs #69, #71). Closed production bug #70 (wrong DOB/height/weight/units showing for account owner).
9. 🧭 **Body Composition Goals module** — add cut / lean recomp goal targets, progress cards, lean-mass guardrails, and estimated completion tracking on top of the existing advanced-metric system. See [`docs/body-composition-goals.md`](docs/body-composition-goals.md).
10. **Continuous barcode scanning** — move `BarcodeScanner.jsx` from single-frame capture to a continuous scanner (ZXing or equivalent).
11. **CI/CD Step 5 — sharding** — shard vitest/Playwright if pipeline wall-clock is still >10 min after warm-cache data is available.
12. **V2.3 Performance Extensions** 🕒 — event/lift metrics and readiness interpretation; explicitly after the family-profile layer.

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

### Product Philosophy: Body Composition Over Scale Weight

Lean Ledger is not intended to be a simple calorie tracker or generic weight-loss app.

The primary objective is to improve body composition while preserving or increasing lean body mass.

Scale weight remains a useful signal, but it is not treated as the sole or highest-value outcome.

Examples:

- reaching `200 lb` while preserving lean mass is a better outcome than reaching `190 lb` with significant muscle loss
- reducing body fat while maintaining strength and muscle mass is more successful than faster scale-weight reduction driven by lean tissue loss
- weight should be interpreted alongside body-fat percentage, lean mass, muscle mass, strength metrics, activity levels, and adherence

**Core principles**

1. Body composition is more important than scale weight alone.
2. Lean mass preservation is a primary success metric.
3. Muscle loss should be surfaced and highlighted, not hidden.
4. Fat-loss efficiency should be favored over rapid weight reduction.
5. Goal evaluation should consider multiple metrics, not weight alone.
6. Progress should be measured across weight, body fat, lean mass, muscle mass, activity, and adherence.
7. When metrics conflict, Lean Ledger should bias toward preserving lean mass and long-term sustainability over aggressive short-term weight loss.

**Success criteria**

A goal phase should not be considered an ideal success if:

- target weight is achieved
- but lean-mass or muscle-mass preservation thresholds are violated

Goal completion should evaluate:

- weight outcomes
- body-fat outcomes
- lean-mass retention
- muscle-mass retention
- rate of change

**Youth guardrails**

This philosophy should be applied conservatively for youth profiles:

- child profiles should not use cut / recomp phases or body-fat targets
- teen profiles may use goal phases only with age-appropriate messaging and stronger guardrails

**Future direction**

Lean Ledger should continue evolving toward a body-composition coaching platform that helps users:

- lose fat
- preserve muscle
- build strength
- improve metabolic health
- make sustainable long-term progress

rather than focusing exclusively on scale-weight reduction.

### Phase 2 Priorities

**Legend**
- ✅ shipped
- 🚧 in progress
- 🧭 next up
- 🕒 later / future iteration

**Current status snapshot** (updated 2026-06-21)
- ✅ Meal intelligence foundation is shipped on `main`
- ✅ Hydration and beverage intelligence foundation is shipped on `main`
- ✅ Daily Wins foundation, configurability, templates, and challenge progress are shipped on `main`
- ✅ Multi-tenant auth, Google OAuth, and invite-only member access are live in production
- ✅ Lean Ledger 2.0 guided onboarding foundation is shipped on `main`
- ✅ V2.1 youth safety guardrails + athlete day-type context are shipped on `main` (PR #41)
- ✅ V2.2 Family Profiles shipped end to end (foundation + Phases 1–5, PRs #42, #48–#56): households, dependent profiles, switching, per-profile data isolation, and youth-safe per-profile coaching — see [`docs/family-profiles.md`](docs/family-profiles.md)
- ✅ UX/QoL Phase A+B: toast/undo, a11y modal, light/dark/system theming (PR #59)
- ✅ Food database integration: merged OpenFoodFacts + USDA search, use_count auto-favorite (PR #64 + follow-up ranking patch)
- ✅ CI/CD: docs path filter, caching, parallelism, security-audit, actionlint workflow validation, quality-gate, CodeQL SAST (PRs #60, #62, #63)
- **Mobile responsiveness pass** — PR #65 shipped bottom-sheet modals, button/touch fixes, padding fixes; full per-page breakpoint audit still needed
- 🧭 Body Composition Goals module is now a prioritized next slice for users cutting or recompositioning with weight + smart-scale body-composition data

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
- family profile / household layer on top of member access — ✅ shipped end to end under **V2.2 Family Profiles** (PRs #42, #48–#56)

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
- `V2.2 Family Profiles` is **shipped end to end** on `main` (PRs #42, #48–#56)
  - shipped: `households`, `household_members`, `profiles` tables (migrations 016–018), `profile_id` FK on all 9 user-owned data tables (backfilled), `lib/models/profileHousehold.js` helpers, active-profile cookie seam (`lib/activeProfile.js`), profile-scoped API routes (`app/api/profiles/`), household management UI (`app/household/page.jsx`), profile switcher in header (`components/ProfileSwitcher.jsx`), per-profile coaching state, and profile-isolation integration tests + E2E coverage
- deeper athlete fueling logic and Lean Recomp day-based macro target adaptation are still ahead

**Recommended next slice**
- `Lean Recomp Day Types & Dynamic Macro Targets` or `V2.3 Performance Extensions` (see the V2.2 rollout section for context)

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

### Lean Recomp Day Types & Dynamic Macro Targets

**Goal:** Evolve the existing `Lean Recomp` goal strategy so daily macro targets can adapt intelligently based on training activity without introducing a separate nutrition mode.

This should be treated as the first concrete macro-target implementation of the broader day-type system, not a one-off exception.

#### Product constraints

- keep the existing profile goal structure
- do **not** introduce a separate `Lean Recomp Mode`
- the primary profile strategy remains `Lean Recomp`
- day type should influence daily targets, not replace the user’s underlying strategy

#### Problem

Current Lean Recomp uses one macro target set every day.

That is too static for users who are lifting regularly and want:

- higher fuel on resistance-training days
- enough support for recovery days
- lower-carb / lower-calorie targets on true rest days

#### Daily types for Lean Recomp

Introduce a reusable per-day concept:

```ts
type DayType = "training" | "recovery" | "rest";
```

Definitions:

- `training`
  - resistance training performed
  - heavy lifting
  - strength training
  - progressive overload work
- `recovery`
  - mobility
  - walking
  - light cardio
  - active recovery
- `rest`
  - no meaningful training

This should layer cleanly on top of the broader 2.0 day-type architecture, which may later include athlete-specific types like `practice`, `game`, or `competition`.

#### UX direction

Add a lightweight `Daily Context` card.

Example:

- `Today's Day Type`
  - `Training Day`
  - `Recovery Day`
  - `Rest Day`

Behavior:

- default to `Rest Day`
- remember the most recent user selection for convenience
- allow fast user override
- keep friction low
- show the current choice anywhere macros are explained
- future enhancement:
  - allow users to optionally set a weekly default cadence while still permitting same-day override

#### Daily Wins integration

If the user completes habits such as:

- `Workout`
- `Strength Training`
- `Heavy Lifting`

the app should suggest an upgrade toward `Training Day` targets.

V1 recommendation:

- show a confirmation suggestion such as:
  - `You logged a strength-focused workout. Switch today to Training Day targets?`
- allow one-tap confirmation

Possible later enhancement:

- support a more aggressive auto-trigger path for clearly strength-focused workout signals, but still give the user a visible chance to confirm or override

Important:

- generic movement such as walking or mobility should **not** trigger `Training Day`
- low-intensity activity should more naturally suggest `Recovery Day`
- do **not** automatically switch day type without confirmation in the first implementation
- suggestion should be assistive, not surprising

#### Lean Recomp macro logic

`Rest Day` should be treated as the default daily assumption for Lean Recomp unless the user selects or confirms a more active day type.

The current Lean Recomp calculation should be evolved into a profile-aware baseline where:

- `Rest Day` becomes the default low-fuel posture
- `Recovery Day` provides the middle path
- `Training Day` adds targeted support for lifting performance and recovery

##### Recovery day

Purpose:

- continue fat loss
- support recovery
- maintain protein

Targets:

- protein unchanged
- carbs low / moderate
- calories above rest day but below training day

##### Training day

Purpose:

- maximize lifting quality
- improve recovery
- preserve or build muscle

Adjustments:

- protein remains high
- carbs increase
- calories increase modestly
- most added calories come from carbohydrates

Suggested starting adjustment:

- `+200 to +400` calories above rest / recovery baseline
- `+50g to +100g` carbs above rest / recovery baseline
- protein unchanged
- fat unchanged or slightly lower as a percentage of calories

##### Rest day

Purpose:

- maintain deficit
- maximize fat loss

Adjustments:

- protein remains high
- carbs lowest
- calories lowest

#### Dashboard / messaging

Dashboard and macro surfaces should clearly identify both strategy and active day type:

- `Lean Recomp — Training Day`
- `Lean Recomp — Recovery Day`
- `Lean Recomp — Rest Day`

Example support copy:

- `Training Day`:
  - `Additional carbohydrates are included today to support lifting performance, recovery, and muscle retention.`
- `Recovery Day`:
  - `Recovery-focused targets help support adaptation while maintaining body composition goals.`
- `Rest Day`:
  - `Lower-carb targets emphasize fat loss while maintaining protein intake.`

#### Architecture guidance

This should be built as reusable target-calculation infrastructure because future strategies may use the same concept.

Examples:

- `Lean Mass Gain`
  - training day
  - recovery day
- `Football Athlete`
  - lift day
  - practice day
  - game day
  - recovery day
- `Track Athlete`
  - workout day
  - competition day
  - recovery day

Recommended calculation seam:

```ts
calculateMacroTargets(goalStrategy, dayType, profileContext)
```

Where:

- `goalStrategy` remains the primary plan
- `dayType` adjusts the active day’s targets
- `profileContext` can later include age group, activity focus, and coaching mode

#### Data model direction

- store `dayType` per day, not in profile defaults alone
- macro-target calculations should consume:
  - profile goal strategy
  - active day type
- keep the day-type system extensible rather than hard-coding it only for Lean Recomp

#### Acceptance criteria

- existing Lean Recomp users continue working without disruption
- user can select `Training`, `Recovery`, or `Rest`
- macro targets update immediately
- dashboard displays active day type
- Daily Wins can suggest a better day type when relevant
- architecture supports future athlete-focused strategies
- Weight Loss, Maintenance, and Lean Mass Gain continue functioning without regression
- tests cover macro-calculation scenarios across day types

### Body Composition Goals Module 🧭

Detailed implementation spec:
- [`docs/body-composition-goals.md`](docs/body-composition-goals.md)

**Goal**
- Add an explicit goal-setting and progress module for users who track weight plus body-composition signals.
- Keep this additive to the existing profile, dashboard, and trends model rather than replacing the current macros workflow.
- Make this part of the broader **Goals** experience, not a disconnected feature area.
- Daily goals such as calories, protein, carbs, workouts, and steps remain; body-composition goals complement those existing goals and strategies.

**Current metrics already tracked**
- Weight
- Body Fat %
- Skeletal Muscle %
- Muscle Mass
- Fat-Free Body Weight
- Visceral Fat

**Phase 1 — Cut**
- Goal Weight
- Goal Body Fat %
- Minimum Lean Mass
- Minimum Muscle Mass
- Target Date

Example:
- `Project 200`
  - Goal Weight: `200 lb`
  - Goal Body Fat: `12%`
  - Minimum Lean Mass: `176 lb`
  - Minimum Muscle Mass: `168 lb`

**Phase 2 — Lean Recomp**
- Goal Weight
- Goal Body Fat %
- Goal Lean Mass
- Goal Muscle Mass
- Target Date

Example:
- `Project Titan`
  - Goal Weight: `215 lb`
  - Goal Body Fat: `10–12%`
  - Goal Lean Mass: `190+ lb`
  - Goal Muscle Mass: `182+ lb`

Only one active phase per profile.
Historical phases remain viewable.

Body-fat targeting should support either:
- a single target
- or a target range

Recommended model:
- `target_body_fat_min`
- `target_body_fat_max`

This allows examples like:
- exact cut target: `12%`
- recomposition target range: `10–12%`

**Dashboard cards**
- Weight Progress
- Fat Loss Progress
- Lean Mass Retention
- Muscle Mass Retention
- Estimated Completion Date

**Calculated fields**
- Current Fat Mass = Weight × Body Fat %
- Current Lean Mass = Weight - Fat Mass
- Remaining Fat To Lose
- Remaining Weight To Goal
- Lean Mass Change Since Goal Start
- Muscle Mass Change Since Goal Start

Potential higher-level summary metrics:
- Muscle Preservation Score
- Lean Mass Retention %
- Fat Loss Efficiency %

**Status indicators**
- Green = on track
- Yellow = watch
- Red = losing lean mass too quickly

**Example display**
- `Weight Goal: 215 → 200 (-15 lbs remaining)`
- `Body Fat Goal: 17.2% → 12% (-5.2% remaining)`
- `Lean Mass Goal: Maintain ≥176 lbs (Current 178.4 lbs)`
- `Muscle Mass Goal: Maintain ≥168 lbs (Current 169.4 lbs)`

**Implementation direction**
- goal values should follow the user's existing profile unit preference automatically
- no separate goal-unit setting
- store canonically in the same format as existing profile / health metrics
- display and editing should always use the user's configured units
- store body-composition goals separately from base profile settings
- derive progress from existing `weight_logs` and `health_metrics`
- use the newest valid body-composition entry for current-state cards
- snapshot a baseline at phase start from the newest valid entry available at that time
- preserve progress calculations even when only some optional metrics are present
- estimated completion date should remain heuristic and only appear when enough trend data exists
- only one active phase per profile at a time
- goal phases should layer on top of `goalStrategy`, not replace it
- body composition should be prioritized over scale weight in success logic
- reaching a goal weight while violating lean-mass or muscle-mass floors should not count as ideal success

**Placement**
- Dashboard:
  - goal summary cards
  - progress rings / bars
  - status indicators
- Trends:
  - detailed body-composition charts
  - historical phase performance
  - lean-mass and muscle-mass progression

**Suggested table**
- `body_composition_goals`
  - `id`
  - `profile_id`
  - `name`
  - `phase_type` (`cut`, `lean_recomp`)
  - `goal_weight`
  - `goal_body_fat_percent` (legacy/simple support)
  - `target_body_fat_min`
  - `target_body_fat_max`
  - `minimum_lean_mass`
  - `minimum_muscle_mass`
  - `goal_lean_mass`
  - `goal_muscle_mass`
  - `target_date`
  - `baseline_recorded_at`
  - `baseline_weight`
  - `baseline_body_fat_percent`
  - `baseline_lean_mass`
  - `baseline_muscle_mass`
  - `completion_weight`
  - `completion_body_fat_percent`
  - `completion_lean_mass`
  - `completion_muscle_mass`
  - `started_at`
  - `completed_at`
  - `archived_at`
  - `created_at`
  - `updated_at`

**Goal completion logic**
- A phase is considered successful when:
  - goal weight is reached, if specified
  - goal body fat is reached, if specified
  - lean-mass floor is maintained
  - muscle-mass floor is maintained
- If a weight goal is reached but lean-mass or muscle-mass floors are violated:
  - show warning
  - do not mark as ideal success

**Estimated completion date**
- show only when:
  - at least 3 entries exist
  - at least 14 days of data exist
  - recent trend direction aligns with the active goal
- label clearly:
  - `Estimated based on recent trend`

**Goal history**
- preserve:
  - phase start date
  - baseline metrics
  - completion metrics
  - goal revisions
- users should be able to review prior phases and compare outcomes

**Guardrails**
- do not require every body-composition metric before showing useful progress
- do not punish users who only track weight
- do not present noisy consumer-scale readings as medical precision
- highlight possible lean-mass loss risk with supportive language, not alarmist copy
- child profiles:
  - no body-fat targets
  - no cut / recomp phases
- teen profiles:
  - allow with age-appropriate messaging and guardrails

**Future support**
- allow multiple goal phases so users can move from Fat Loss to Lean Recomp without losing historical progress
- keep completed phases visible historically while the dashboard focuses on the active phase
- allow macro recommendations to adapt based on the active phase:
  - cut phase → cutting / keto-oriented macros
  - lean recomp phase → higher protein and training-day calorie increases
- integrate with the existing `goalStrategy` framework rather than replacing it

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

#### V2.2 Family Profiles ✅ (shipped)

**Data foundation ✅ (PR #42)** — `households`, `household_members`, `profiles` tables; `profile_id` FK on all 9 user-owned data tables (backfilled); idempotent `ensureDefaultHouseholdForUser` / `ensurePrimaryProfileForUser` helpers.

**Application layer ✅ (PRs #48, #49, #50, #52, #53, #54, #55, #56, + Phase 5)** — wired into the running app. The per-request data boundary moved from "current user" to "current *active profile*", scoped to a household the user belongs to. Landed behind tests, one concern per PR. See [`docs/family-profiles.md`](docs/family-profiles.md).

Goal: support multiple profiles per household, let a parent/admin create and manage child/teen profiles, and switch profiles explicitly and safely.

##### Phase 1 — Wire in the foundation + active-profile seam (no behavior change) ✅ (PR #48)
- Call `ensurePrimaryProfileForUser` on sign-in (Auth.js `signIn` event) and during owner bootstrap so every existing/new user has a household + primary profile.
- Add `lib/models/profile.js` read helpers (`findById`, `findByHousehold`, `findManagedBy`, `findActiveForUser`).
- Add a `getActiveProfileId(request)` seam in `lib/auth.js` that resolves the active profile from a signed/validated cookie (`ll_active_profile`), falling back to the user's primary profile (`profiles.source_user_id = userId`). The cookie value is re-validated against household membership on every request — never trusted from the client.
- No data route changes yet → zero behavior change. Pure plumbing + unit tests.

##### Phase 2 — Profile-scoped data access (the risky core) ✅ (PRs #49 meals, #50 weight/beverages/health, #52 favorites/habits, #53 stats + retire user-scoped reads)
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

##### Phase 3 — Profile management API (admin/owner gated) ✅ (PR #54)
- `GET /api/profiles` — list profiles in the caller's household.
- `POST /api/profiles` — create a dependent (child/teen) profile; owner/admin only; reuse `validateProfilePayload` + youth-safety derivation from DOB.
- `PUT /api/profiles/:id` — edit a profile the caller manages.
- `DELETE /api/profiles/:id` — remove a dependent profile; never the primary/source profile.
- `POST /api/profiles/:id/activate` — set the active profile (writes the validated cookie).
- Rules: never trust `profileId`/role/email from the client; every handler derives the actor from the session.

##### Phase 4 — Switcher + management UI ✅ (PR #55)
- Header profile switcher (active profile → household list → switch).
- `/household` management page: list profiles, add child/teen, edit, remove.

##### Phase 4.5 — Per-profile coaching state ✅ (PR #56)
- Targets/macros/diet style/daily wins + youth-safety guardrails derive from the **active** profile (`resolveActiveCoachingSubject`), so a switched-to child sees its own age-safe numbers instead of the account holder's. `/api/profile` and stats are active-aware; the primary still uses the authoritative `users` row.

##### Phase 5 — Isolation E2E, polish, docs ✅
- Browser E2E (`tests/e2e/householdProfiles.spec.js`): create a child → switch → confirm per-profile data isolation + youth-safe coaching → switch back.
- Household/profile model documented in [`docs/family-profiles.md`](docs/family-profiles.md) (+ README pointer).

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

**Implemented shape**
- `changes` always runs first and skips the heavy pipeline for docs-only changes.
- Code changes fan out into parallel `validate`, `local-functional`, `security-audit`, and `workflow-lint` jobs.
- `quality-gate` always runs and explicitly fails unless every required code gate succeeds.
- PR deploys wait on `quality-gate` before `deploy-preview` and `preview-post-deploy`.
- Main deploys wait on `quality-gate` before `deploy-production` and `production-post-deploy`.

**Guardrails (carry through every step)**
- Every existing gate stays required and blocking — no gate removed, demoted, or stubbed.
- Prefer orchestration/caching changes over changing what is tested.
- Deployed-environment checks (preview/production post-deploy) remain real gates against live Vercel URLs.
- Measure wall-clock before and after each step; don't add complexity that doesn't pay for itself.

---

### Step 1 — Docs path filter ✅ (ship immediately)

Skip the heavy pipeline on docs-only pushes/PRs. Design constraint: if pipeline jobs are *required checks* for merge, `paths-ignore` alone blocks docs PRs (the required check never reports). Solution: a lightweight `changes` job that always runs and short-circuits the rest when only docs changed.

```yaml
# Add to the top of pipeline.yml, before all other jobs:
jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      code: ${{ steps.filter.outputs.code }}
    steps:
      - uses: actions/checkout@v6
      - id: filter
        uses: dorny/paths-filter@v4
        with:
          filters: |
            code:
              - '**'
              - '!**.md'
              - '!docs/**'
              - '!ROADMAP.md'

  validate:
    needs: changes
    if: needs.changes.outputs.code == 'true'
    # ... rest unchanged

  # Heavy jobs use:
  # needs: changes
  # if: needs.changes.outputs.code == 'true'
```

**Required PR status checks** in GitHub branch protection: require `changes` and `quality-gate`. Docs-only PRs pass after the filter confirms no code changed; code PRs must pass every joined gate.

**Acceptance criteria:**
- A PR that touches only `.md` / `docs/` files completes in < 30 s (only `changes` runs)
- A PR that touches any `.js`/`.jsx`/`.mjs`/`.yml`/`.sql` file runs the full pipeline

---

### Step 2 — Aggressive caching ✅

Three high-value caches, each a small `actions/cache` block:

**2a. Next.js build cache** (`.next/cache`) — avoids full incremental rebuild on unchanged pages. Add to `validate` and `local-functional`:
```yaml
- uses: actions/cache@v4
  with:
    path: .next/cache
    key: nextjs-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}-${{ hashFiles('**/*.js','**/*.jsx','**/*.mjs') }}
    restore-keys: nextjs-${{ runner.os }}-
```

**2b. Playwright browsers** (`~/.cache/ms-playwright`) — browser install is the single largest repeated cost in `local-functional`:
```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v4
  id: playwright-cache
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}
- run: npx playwright install --with-deps chromium
  if: steps.playwright-cache.outputs.cache-hit != 'true'
- run: npx playwright install-deps chromium
  if: steps.playwright-cache.outputs.cache-hit == 'true'
```

**2c. npm cache** — already partially handled by `actions/setup-node cache: npm`; no change needed.

**Expected savings:** ~2–3 min per run on unchanged builds, ~1–2 min on Playwright install cache hits.

---

### Step 3 — Parallelize validate + local-functional ✅

Currently `local-functional` waits for `validate` to finish before starting. These are independent quality gates — parallelizing trades the "fail fast on unit tests before spending time on E2E" fast-fail for wall-clock time.

**Decision:** parallelize (wall-clock matters more for a small-team project; either job failing still blocks the pipeline).

Change `local-functional`:
```yaml
local-functional:
  needs: changes          # was: needs: validate
  if: needs.changes.outputs.code == 'true'
```

Add a gate job so `deploy-preview` and `deploy-production` still wait for both:
```yaml
quality-gate:
  needs: [changes, validate, local-functional, security-audit, workflow-lint]
  if: always()
  runs-on: ubuntu-latest
  steps:
    - run: |
        # For code changes, explicitly require every joined gate to report success.
        # For docs-only changes, pass after changes confirms the heavy jobs were skipped.
        echo "All quality gates passed"

deploy-preview:
  needs: [changes, quality-gate]   # was: needs: [validate, local-functional]
  ...

deploy-production:
  needs: [changes, quality-gate]
  ...
```

**Expected savings:** wall-clock drops by ~(duration of validate) since both run simultaneously.

---

### Step 4 — Split `npm audit` into a parallel job ✅

Currently `npm audit` runs inside `validate`, serialized behind `npm run build`. A security finding blocks the build step from reporting.

Extract to a parallel job:
```yaml
security-audit:
  needs: changes
  if: needs.changes.outputs.code == 'true'
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v6
    - uses: actions/setup-node@v6
      with: { node-version: '20', cache: npm }
    - run: npm ci
    - run: npm audit --audit-level=high
```

Remove `npm audit` from `validate`. Add `security-audit` to the `quality-gate` needs list.

### Step 4b — Add actionlint workflow validation ✅

GitHub Actions workflow changes now run through actionlint before deployment:

```yaml
workflow-lint:
  needs: changes
  if: needs.changes.outputs.code == 'true'
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v6
    - name: Check GitHub Actions workflows
      uses: docker://rhysd/actionlint:1.7.12
      with:
        args: -color
```

`workflow-lint` is included in `quality-gate`, so bad workflow syntax, invalid expressions, bad `needs:` references, or unsafe workflow patterns block preview/production deployment.

---

### Step 5 — Shard vitest/Playwright if still needed 🧭

Evaluate after Steps 1–4. If `validate` or `local-functional` still dominates wall-clock:

**Vitest sharding** (matrix):
```yaml
strategy:
  matrix:
    shard: [1/2, 2/2]
steps:
  - run: npm run test:coverage -- --shard=${{ matrix.shard }}
```

**Playwright sharding** (matrix):
```yaml
strategy:
  matrix:
    shard: [1/2, 2/2]
steps:
  - run: npm run test:e2e -- --shard=${{ matrix.shard }}
```

Add a merge-report step to combine coverage artifacts before the gate.

**Only add sharding if wall-clock after Steps 1–4 is still > 10 min.**

---

### Operational workflows (outside the pipeline review scope)

Two additional workflows are live in `.github/workflows/` but are not part of the pipeline review:

- **`database-backup.yml`** — scheduled Postgres backup job
- **`rollback-production.yml`** — manual trigger to roll back a production deployment

These are operational runbooks, not quality gates. They are not part of the Steps 1–5 pipeline optimization effort.

### Measurement plan

Before starting Step 2: record current wall-clock for a typical PR run (validate duration, local-functional duration, total from push to deploy-preview). After each step, record the same. Log in a comment on the CI/CD PR.

## Application UX & Theming

A full per-page UX/UI review was done before making changes — see [`docs/ux-review.md`](docs/ux-review.md) for per-page findings, a prioritized QoL recommendation list, quick wins, and the theming analysis. This is intentionally **review-first**: no UX changes ship until the recommendations are triaged.

### Phase A — UX / quality-of-life cleanup ✅

**Stack addition:** `sonner` — the current Next.js standard for toast notifications (~3 kb, Radix-based, accessible). Add `<Toaster />` once in `app/layout.jsx`.

**Pattern rules (applied everywhere in this phase):**
- Field/form validation errors → inline `<p class="field-error">` below the relevant input, persistent until corrected.
- Transient success messages → `toast.success('…')` from sonner (auto-dismiss 3 s).
- Destructive action undo → `toast('Item deleted', { action: { label: 'Undo', onClick: restore }, duration: 5000 })`. Optimistic: remove from UI immediately, restore on undo, send DELETE only after toast expires.
- Zero `alert()` / `confirm()` calls anywhere in application code after this phase.

#### P0 tasks (must all ship together)

**1. Add sonner**
- `npm install sonner`
- `<Toaster />` in `app/layout.jsx` (client boundary wrapper)
- `lib/toast.js` re-export for consistent import path

**2. Replace ~25 `alert(err.message)` calls**
- `app/page.jsx` line 229 (Dashboard save failure)
- `app/meals/page.jsx` ~20 call sites (add meal, add beverage, favorites, habits)
- `app/weight/page.jsx` line 56
- `app/profile/page.jsx` (profile save, habits loop, member management)
- `app/health/page.jsx` lines 96, 120
- Replace with `toast.error(err.message)` (non-blocking, dismissable)

**3. Replace `confirm()` with undo toasts**
- `app/meals/page.jsx` lines 552, 714, 723, 733, 801 (delete food, favorite meal/food/beverage, beverage entry)
- Pattern: optimistic delete → undo toast (5 s window) → send DELETE after expiry

**4. Resolve duplicate Dashboard check-in**
- `app/page.jsx` lines 517–639: remove the editable "Lean Recomp Check-In" form
- Replace with a read-only summary card: today's logged wins count + names
- Add "Edit in Intake →" deep link to `/meals#daily-wins`
- Intake `Today's Wins` becomes the single editor

**5. Modal a11y**
- `components/Modal.jsx`: add focus trap (tab/shift-tab cycles within modal), `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to modal title, `aria-label="Close"` on `×` button, restore focus to trigger on close

#### P1 tasks (ship in Phase A or immediate follow-on)

**6. FoodSearch results → buttons** (`components/FoodSearch.jsx` lines 137–149)
- `<div onClick>` → `<button type="button">`; CSS `:hover`/`:focus-visible` replaces `onMouseEnter`/`onMouseLeave` recoloring

**7. Header a11y** (`components/Header.jsx`)
- Add `aria-expanded={menuOpen}` to hamburger button, `aria-controls="nav-menu"`, `id="nav-menu"` on nav
- Move injected `<style>` block responsive rules into `globals.css` (remove `!important` fragility)

**8. Page chrome standardization**
- Add `.page-container`, `.page-header`, `.data-table` classes to `globals.css`
- Unify padding: Dashboard/Intake `20px` vs Weight/Trends/Health/Profile `40px 20px` — pick one and use the class everywhere

**9. Date prev/next/"Today" stepper**
- `DateStepper` component: `← [date input] → [Today]`; use in Dashboard and Intake date pickers

**10. Touch targets** — `InlineActionButton` (or equivalent): min `padding: 8px 4px`, `font-size: 14px`, 44×44 px touch area

**11. Fix duplicate youth-safety message** — remove one of the two duplicate `youthSafetyMessage` blocks in `app/profile/page.jsx` (lines 488–500 vs 518–532)

**12. Quick wins batch** (each S effort, ship together)
- `Loading.jsx`: `role="status"` + `aria-live="polite"`
- `app/page.jsx`: hide "Progress Photo Placeholder" section until uploads exist
- `app/weight/page.jsx`: add `+`/`−` sign + `▲`/`▼` icon to weight change stat card
- `components/ErrorMessage.jsx`: replace `backgroundColor: '#ffebee'` with `var(--danger-surface)` (add the CSS var with a light-mode value here; Phase B handles dark)

#### Acceptance criteria
- `grep -r "alert(" app/ components/` → zero matches
- `grep -r "confirm(" app/ components/` → zero matches
- Dashboard check-in form removed; Intake is the sole `Today's Wins` editor
- `Modal` passes keyboard trap: tab cycles within, Escape closes, focus restores to trigger
- `FoodSearch` results are keyboard/touch accessible
- All existing Vitest unit tests and Playwright E2E pass without regression

#### Tests to add
- Unit: toast utility exports work
- Unit: `Modal` focus trap — focus moves to first focusable element on open; does not leave modal on tab
- E2E: add meal → delete → undo → meal reappears (Intake)
- E2E: form validation surfaces inline error text, no browser dialog

---

### Phase B — Theming (light / dark / system) ✅ (shipped PR #59)

**Stack addition:** `next-themes` — SSR-safe, FOUC-free, ~2 kb. The current Next.js standard for theme switching.

Tracked separately because token hardening is a horizontal refactor across every component; interleaving it with behavioral changes makes diffs hard to review and regressions hard to bisect.

#### Step 1 — Token hardening (prerequisite, can be its own PR)

Add semantic tokens to `app/globals.css` `:root`:
```css
--surface-muted: #f5f5f5;
--danger-surface: #ffebee;
--warning-surface: #fff8e1;
--feedback-positive-surface: rgba(46,125,50,0.08);
--feedback-info-surface: rgba(2,119,189,0.08);
--chart-1: #1f6feb;  --chart-2: #e74c3c;  --chart-3: #16a085;
--chart-4: #8e44ad;  --chart-5: #f39c12;  --chart-grid: #dfe6e9;
--btn-primary-hover: color-mix(in srgb, var(--primary-color) 80%, black);
--btn-secondary-hover: color-mix(in srgb, var(--secondary-color) 80%, black);
--btn-danger-hover: color-mix(in srgb, var(--danger-color) 80%, black);
```

Replace hardcoded colors in these specific files:
- `components/ErrorMessage.jsx:5` → `var(--danger-surface)`
- `components/FoodSearch.jsx` → `var(--card-background)`, `var(--surface-muted)`, `var(--danger-surface)`, `var(--text-secondary)`
- `components/ProductLookup.jsx:261` → `var(--surface-muted)`
- `components/BarcodeScanner.jsx` → `var(--danger-surface)`, `var(--warning-surface)`
- `app/login/page.jsx` inline `rgba()` banners → `var(--danger-surface)`, `var(--feedback-info-surface)`
- `components/HydrationFeedback.jsx` + Intake `MealFeedback` tone backgrounds → `var(--feedback-positive-surface)`, `var(--feedback-info-surface)`
- All inline `rgba(52,152,219,0.08)` info panels → `var(--feedback-info-surface)`
- `globals.css` button hover colors → `var(--btn-*-hover)` tokens
- Recharts: create `lib/chartTheme.js` that reads `--chart-1…5` and `--chart-grid` from `getComputedStyle(document.documentElement)` at render time; pass to all chart stroke/fill props in `app/trends/page.jsx` and `app/weight/page.jsx`

#### Step 2 — Dark palette

```css
:root { color-scheme: light dark; }

[data-theme="dark"] {
  --background: #0d1117;       --card-background: #161b22;
  --border-color: #30363d;     --text-primary: #e6edf3;
  --text-secondary: #8b949e;   --shadow: 0 1px 3px rgba(0,0,0,0.5);
  --surface-muted: #21262d;    --danger-surface: #2d1b1b;
  --warning-surface: #2d2208;
  --feedback-positive-surface: rgba(46,125,50,0.15);
  --feedback-info-surface: rgba(2,119,189,0.15);
  --chart-grid: #30363d;
}
```

#### Step 3 — next-themes wiring

- `npm install next-themes`
- `components/ThemeProvider.jsx` — client wrapper: `<NextThemesProvider attribute="data-theme" defaultTheme="system" enableSystem storageKey="ll_theme">`
- Wrap `{children}` in `app/layout.jsx` with `<ThemeProvider>`
- `components/ThemeToggle.jsx` — 3-state segmented control (System / Light / Dark) using `useTheme()` from next-themes

#### Step 4 — Toggle placement

- `<ThemeToggle />` in Profile > Appearance section (`app/profile/page.jsx`) — not placed in the Header; the Header retains the profile switcher only

#### Acceptance criteria
- `grep -rE "backgroundColor: '(white|#[0-9a-fA-F]{3,6})" app/ components/` → zero matches (Nutri-Score brand colors in `ProductLookup` are an accepted exception)
- Dark mode: all surfaces readable — no white-on-white panels, no invisible text
- Recharts charts use dark-appropriate colors in dark mode
- BarcodeScanner overlays readable in dark mode
- `prefers-color-scheme: dark` honored without user setting (default system)
- User preference persists across reloads (localStorage via next-themes, no FOUC)
- All existing tests pass

## Food Database Integration ✅ (shipped PR #64)

**Goal:** let users search a real food/nutrition database to auto-fill the Add Meal form, eliminating manual macro entry for common foods. Auto-save as a favorite food after two uses.

### API strategy

**OpenFoodFacts** (`https://world.openfoodfacts.org/cgi/search.pl`) — free, no API key, broad coverage, community-driven. Best for many branded / packaged foods.

**USDA FoodData Central** (`https://api.nal.usda.gov/fdc/v1/foods/search`) — requires a free API key (`USDA_FOOD_API_KEY` env var). Best for ingredient-style and whole-food lookups. Store the key in Vercel env vars + `.env.local`.

**Current shipped behavior:** search both sources server-side, normalize into one shape, merge + rank results, and return the best combined list. USDA is no longer just a zero-result fallback.

Never expose API keys client-side. All food lookups go through a server-side route handler.

### User flow

1. User opens the Add Meal modal on Intake and clicks **"Search Food"** (existing `FoodSearch.jsx` entry point).
2. Types a query (e.g. "greek yogurt chobani"). Results stream from `/api/food-search?q=…`.
3. Selects a result — macros, calories, and serving size auto-fill the Add Meal form fields.
4. User adjusts serving size (optional) → logs normally via existing `POST /api/meals`.
5. After the meal is logged, the app increments a use-count for that food item. If the count reaches 2, a sonner toast fires: **"You've used Greek Yogurt twice — save as a favorite?"** with `[Save]` / `[Not now]` actions.

### New API route

**`GET /api/food-search?q={query}&source={auto|openfoodfacts|usda}`**
- Server-side only (API key safety)
- Calls OpenFoodFacts and USDA server-side, then merges + ranks the normalized results
- Returns a normalized array (max 10 results):
  ```json
  [
    {
      "id": "off:3017624010701",
      "source": "openfoodfacts",
      "name": "Greek Yogurt",
      "brand": "Chobani",
      "servingSize": 170,
      "servingUnit": "g",
      "calories": 100,
      "protein": 17,
      "fat": 0,
      "carbs": 6
    }
  ]
  ```
- Response cached for 1 hour via `Cache-Control: public, max-age=3600` (food data doesn't change often)
- Returns `{ source: "openfoodfacts"|"usda"|"combined"|"none", results: [] }`
- Current ranking behavior:
  - exact name matches rank highest
  - starts-with and contains matches are boosted
  - token overlap is rewarded
  - USDA gets a slight tie-break preference for ingredient-style results
  - dedupe by normalized `name + brand`

### Auto-save to favorites

**Data model:** add `food_use_count` table (or a column on `favorite_foods`):
```sql
-- migration 019
ALTER TABLE favorite_foods
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT,          -- 'openfoodfacts' | 'usda' | 'manual'
  ADD COLUMN IF NOT EXISTS use_count INTEGER NOT NULL DEFAULT 0;
```

**Logic (server-side, in `POST /api/meals` handler):**
1. If `externalFoodId` is present in the meal payload, upsert a `favorite_foods` row with `use_count = use_count + 1`.
2. If `use_count` transitions from 1 → 2, include `"suggestFavorite": true` in the `POST /api/meals` response.
3. Client receives the flag → fires the "Save as favorite?" toast.
4. If user clicks Save: `POST /api/favorites/foods` with the normalized food data (already in client state). If Not Now: no action, no re-prompt.

### `FoodSearch.jsx` changes

- Wire the existing component to `GET /api/food-search?q=…` (currently stubbed or hitting a different source).
- Show a source subtitle when source is `usda`, `openfoodfacts`, or `combined`.
- Show a "No results found" empty state (already exists) when source is `none`.
- Convert result rows from `<div>` to `<button>` (also a Phase A P1 task — do here if Phase A hasn't shipped yet).
- Add a skeleton loader (3 shimmer rows) while the request is in flight.

### `ProductLookup.jsx` changes

Barcode scan → product lookup already hits OpenFoodFacts by barcode. No change needed to the lookup itself. After a barcode-scanned food is logged, apply the same `use_count` / suggest-favorite flow above.

### Environment variables

```
# .env.local / Vercel env vars
USDA_FOOD_API_KEY=your_key_here   # free at https://fdc.nal.usda.gov/api-guide.html
```

No key needed for OpenFoodFacts primary path.

### Acceptance criteria

- Searching "chicken breast" returns ≥1 relevant result with correct macros
- Searching a USDA-style whole-food item like rotisserie chicken can surface USDA results even when OpenFoodFacts also has generic hits
- Combined-source searches can label results as blended when both sources contribute
- Selecting a result auto-fills all macro fields in the Add Meal form; user can still edit them
- Logging the same food twice triggers the "Save as favorite?" toast
- Accepting the toast saves the food to `favorite_foods` and it appears in the Favorites list
- Declining the toast does not re-prompt
- `GET /api/food-search` is never called from the client directly (server route only)
- `USDA_FOOD_API_KEY` is never exposed in any client bundle (`grep -r "USDA_FOOD" .next/` → zero matches)
- All existing meal logging tests pass without regression

### Tests to add

- Unit: `lib/foodSearch.js` — OpenFoodFacts response normalizer maps fields correctly
- Unit: `lib/foodSearch.js` — USDA response normalizer maps fields correctly
- Unit: `lib/foodSearch.js` — merged ranking returns both sources when available
- Unit: `lib/foodSearch.js` — exact USDA ingredient match can outrank generic packaged-food OFF hits
- Integration: `GET /api/food-search?q=banana` returns normalized shape (mocked HTTP)
- Integration: `use_count` increments on meal log with `externalFoodId`; `suggestFavorite: true` fires at count=2
- E2E: search → select → log flow (mock the external API with Playwright `page.route`)

### Future enhancements

The current merged search is a good baseline, but it is not yet a fully intent-aware search system. Strong follow-up improvements:

1. **Intent-aware ranking**
   - boost USDA for ingredient / whole-food queries
   - boost OpenFoodFacts for branded / packaged-food queries

2. **Favorites and history boosting**
   - rank previously selected foods and favorites higher for that user/profile

3. **Fuzzy matching**
   - tolerate misspellings and partial terms like `rotiserie chicken`

4. **Query rewrites and synonyms**
   - `bbq` ↔ `barbecue`
   - `chicken breast` ↔ `breast, meat only`
   - `ground beef` ↔ `beef, ground`

5. **Source-aware presentation**
   - optional grouped sections such as:
     - `Best matches`
     - `Whole foods (USDA)`
     - `Packaged foods (Open Food Facts)`

6. **Local caching / curated ingredient index**
   - cache high-frequency USDA queries
   - optionally maintain a small local curated ingredient dataset for the most common whole-food lookups

---

## Other future work

(Stub — add to as we go.)

- **Food database integration** — ✅ shipped (PR #64 + follow-up ranking patch). `GET /api/food-search`, merged OpenFoodFacts + USDA ranking, `use_count` auto-favorite suggestion. See spec above and [`docs/FOOD_SEARCH.md`](docs/FOOD_SEARCH.md).
- **Barcode scanning** — `BarcodeScanner.jsx` and `lib/barcodeScanner.js` exist with ZXing continuous stream fallback. Native `BarcodeDetector` path still uses polling. Next priority: unify on pure ZXing continuous path. See [`docs/BARCODE_SCANNING.md`](docs/BARCODE_SCANNING.md).
- **Mobile responsiveness pass** — 🚧 in progress. PR #65 shipped bottom-sheet modals, touch targets, and action-row wrapping. Full per-page breakpoint audit is the remaining work.
- **Recipe management** — log a saved recipe as one entry instead of re-entering ingredients.
- **Meal planning** — forward-looking meal plan with target adherence.
- **Micronutrient tracking** — fiber, sugar, sodium, vitamins/minerals.
- **Fitness tracker integration** — pull weight/activity from Apple Health, Google Fit, Whoop, etc.
- **Screenshot import for health metrics** — roadmap placeholder. Helper guidance is already in-app, but OCR-based screenshot import is still coming soon.
- **Apple Health import flow** — roadmap placeholder. Native sync and import UX are still coming soon.
