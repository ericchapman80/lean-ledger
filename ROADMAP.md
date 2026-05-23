# Lean Ledger — Roadmap

Future work that isn't part of the initial Next.js + Neon port. Each item below has been scoped well enough to pick up cold later.

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
- **Mobile responsiveness pass** — current CSS is desktop-first; needs a real audit on mobile breakpoints.
- **Recipe management** — log a saved recipe as one entry instead of re-entering ingredients.
- **Meal planning** — forward-looking meal plan with target adherence.
- **Micronutrient tracking** — fiber, sugar, sodium, vitamins/minerals.
- **Fitness tracker integration** — pull weight/activity from Apple Health, Google Fit, Whoop, etc.
