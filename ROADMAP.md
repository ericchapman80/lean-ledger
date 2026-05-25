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

### 1. Favorite Meals / Meal Templates

- **Allow users to**:
  - save reusable meals
  - quickly re-add meals
  - repeat yesterday’s breakfast/lunch/dinner
  - minimize repetitive logging friction
- **Rationale**:
  - Most users repeat meals regularly.
  - Meal reuse dramatically improves speed, consistency, and retention.

### 2. Smart Favorite Meal Detection

- **Detect repeated meal combinations automatically.**
- **Example**:
  - “You’ve logged this breakfast 5 times. Save as a favorite meal?”
- **Rationale**:
  - Reduces friction and helps users build sustainable routines without manual organization work.

### 3. Meal-Level Macro Feedback

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

### 4. Meal Trends & Behavioral Analytics

- **Track meal-level patterns over time.**
- **Examples**:
  - average breakfast protein
  - snack frequency
  - dinner calorie trends
  - meal timing consistency
  - high-protein meal streaks
- **Rationale**:
  - This supports sustainable behavior change and gives users meaningful insight into eating patterns.

### 5. Repeat & Quick-Add UX

- **Improve rapid logging workflows.**
- **Examples**:
  - Repeat Last Meal
  - Repeat Yesterday’s Breakfast
  - Add Favorite Meal
  - Quick Add Frequent Meals
- **Rationale**:
  - Daily logging speed is one of the most important retention drivers.

### 6. Meal Categories & Context

- **Future-friendly support for**:
  - Pre Workout
  - Post Workout
  - Track Meet
  - Recovery Meal
- **Constraint**:
  - Do not overcomplicate the initial UX.
- **Rationale**:
  - Supports athletic/recovery workflows without requiring a complex nutrition system.

### 7. Meal-Centric Dashboard Direction

- **Continue evolving the app toward**:
  - meal-first UX
  - meal summaries
  - meal-level trends
  - reduced database/admin-panel feel
- **Rationale**:
  - Users think in meals, not food rows.

### 8. Behavioral Coaching Layer

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

Hydration intelligence should be treated as a **high-priority Phase 2 direction** because it supports the Lean Recomp philosophy without increasing logging friction:

- **low cognitive load**
- **fast logging**
- **mobile-first behavior tracking**
- **lightweight intelligence**
- **consistency over perfection**

### Partial Hydration Contribution System

- **Goal**:
  - Improve hydration realism while preserving a simple, non-technical UX.
- **Background**:
  - Not all beverages contribute equally toward hydration.
  - Water, tea, and electrolyte drinks should count differently than protein shakes, keto coffee, milk, soda, or alcohol.

### Internal Hydration Contribution Multipliers

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

### Hydration Calculation Behavior

- **Hydration progress should be derived from**:
  - beverage amount
  - hydration contribution multiplier
- **Example**:
  - 16 oz black coffee → ~14.4 oz hydration counted internally

### Preserve Low Cognitive Load

- **Do not expose hydration math everywhere in the UI**
- **Default UX should remain simple**:
  - hydration total
  - target
  - remaining
  - progress

### Optional Hydration Details

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

### Future Hydration Intelligence

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
| `npm install next-auth @auth/neon-adapter` | 5 min | |
| Create `app/api/auth/[...nextauth]/route.js` | 15 min | Configure Google provider, Neon adapter, JWT session strategy |
| Add Auth.js schema tables to Neon | 5 min | Auth.js ships the SQL — 4 tables (`accounts`, `sessions`, `verification_tokens`, plus its own `users` table). Merge/reconcile with the existing `users` table that holds profile data (age/height/weight/goal). |
| Update `lib/auth.js#getCurrentUserId()` to read session | 10 min | One-file change; route handlers pick it up automatically |
| Add login page + user menu in header | 60 min | `<button>Sign in with Google</button>`, dropdown with avatar/email/sign-out |
| Add route protection middleware | 30 min | `middleware.js` at root, redirect unauthenticated users to `/login`, gate API routes |
| Adapt existing `users` row to merge with Auth.js's `users` table | 30 min | Profile data lives alongside auth identity. Likely solution: keep one `users` table with all columns, point Auth.js adapter at it. |

### Required env vars (production + local)

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_SECRET=...  # generate with: openssl rand -base64 32
NEXTAUTH_URL=https://lean-ledger.vercel.app
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
