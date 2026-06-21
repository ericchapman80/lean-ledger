# 📒 Lean Ledger

A personal macro accountability ledger. Track protein, fat, and carbs against goal-based targets calculated from your stats using the Mifflin-St Jeor equation.

Single Next.js 15 app deployed to Vercel, with Postgres for persistence.

The DB driver (`postgres` package, porsager) speaks the standard Postgres wire protocol, so **the exact same code runs against either Neon (cloud) or a local Postgres install** — only the `DATABASE_URL` differs.

Daily Wins is an opt-in surface:

- new users start with zero active Daily Wins
- Intake and Dashboard only show habits after explicit configuration in Profile

Google auth groundwork is also opt-in:

- auth code can be deployed safely before cutover
- the app stays on the current single-user owner flow until `AUTH_ENABLED=true`
- do not enable auth in preview or production until the owner-claim rehearsal is complete
- claim the existing owner row first with `AUTH_OWNER_EMAIL` and the `npm run auth:claim-owner:*` scripts

Local auth note:

- env-targeted scripts use `dotenv -o` so `.env.local`, `.env.preview.local`, and `.env.production.local` override inherited shell env vars
- this matters for auth because stale shell values can make `AUTH_ENABLED`, `AUTH_GOOGLE_ID`, or `AUTH_GOOGLE_SECRET` appear unset even when the env file is correct
## Build In Quality

Lean Ledger should default to **building quality in**, not trying to test quality in later.

That means:

- ship logic changes with unit coverage
- ship cross-page or user-flow changes with functional/E2E coverage when practical
- ship DB changes with safe additive migrations and rollout notes
- ship GitHub Actions workflow changes with actionlint validation
- keep CI as a real release gate, not an optional afterthought
- prefer fixing root causes over retrying broken behavior manually

Working expectations:

- UI changes that affect user behavior should usually include tests
- shared business rules should live in helpers that are easy to test directly
- schema changes should be backward-safe and environment-aware
- preview and production verification should stay part of the delivery path
- quality should be part of feature completion, not a follow-up chore

## Product Philosophy

Lean Ledger is not intended to be a simple calorie tracker or generic weight-loss app.

The core objective is to improve body composition while preserving or increasing lean body mass.

Scale weight remains a useful signal, but it is not treated as the sole or highest-value outcome.

Examples:

- Reaching `200 lb` while preserving lean mass is a better outcome than reaching `190 lb` with significant muscle loss.
- Reducing body fat while maintaining strength and muscle mass is a better outcome than faster scale-weight reduction driven by lean tissue loss.
- Weight should be interpreted alongside body-fat percentage, lean mass, muscle mass, strength metrics, activity levels, and adherence.

### Core principles

1. Body composition matters more than scale weight alone.
2. Lean mass preservation is a primary success metric.
3. Muscle loss should be surfaced and highlighted, not hidden.
4. Fat-loss efficiency should be favored over rapid weight reduction.
5. Goal evaluation should consider multiple metrics, not weight alone.
6. Progress should be measured across weight, body fat, lean mass, muscle mass, activity, and adherence.
7. When metrics conflict, Lean Ledger should bias toward preserving lean mass and long-term sustainability over aggressive short-term weight loss.

### Success criteria

A goal phase should not be considered an ideal success if:

- target weight is achieved
- but lean-mass or muscle-mass preservation thresholds are violated

Goal completion should evaluate:

- weight outcomes
- body-fat outcomes
- lean-mass retention
- muscle-mass retention
- rate of change

### Youth guardrails

This philosophy should be applied conservatively for youth profiles:

- child profiles should not use cut / recomp phases or body-fat targets
- teen profiles may use goal phases only with age-appropriate messaging and stronger guardrails

### Long-term direction

Lean Ledger should continue evolving toward a body-composition coaching platform that helps users:

- lose fat
- preserve muscle
- build strength
- improve metabolic health
- make sustainable long-term progress

rather than focusing exclusively on scale-weight reduction.

## Environment management

Use one env file per database target:

- `.env.local`: local Postgres
- `.env.preview.local`: Neon preview / QA
- `.env.production.local`: Neon production for careful local verification only

The app keeps its default scripts for Vercel and generic local use:

- `npm run dev`
- `npm run build`
- `npm run test`
- `npm run init-db`

And it now adds explicit environment-targeted commands:

```bash
npm run dev:local
npm run dev:preview
npm run dev:prod

npm run init-db:local
npm run init-db:preview
npm run init-db:prod
```

`init-db:prod` includes an explicit confirmation prompt because it should only be used intentionally against production.

## Setup

Pick one of two local development paths. Both end with a dev server on http://localhost:3000.

### Option A — Neon (cloud DB, no local install)

Best when you already have Neon set up via Vercel or want to share the DB across machines. Free tier is generous.

```bash
git clone <your-repo-url> lean-ledger
cd lean-ledger
npm install
cp .env.example .env.local
```

Then edit `.env.local` and paste your Neon connection string. To get one:

1. `console.neon.tech` → your project → **Branches** → create a `dev` branch (instant, copy-on-write, keeps prod data clean)
2. Click the `dev` branch → **Connection Details** → copy the URL (looks like `postgresql://neondb_owner:...@ep-...neon.tech/neondb?sslmode=require`)
3. Paste into `.env.local` as `DATABASE_URL=…`

```bash
npm run init-db:preview   # create schema on the preview branch intentionally
npm run dev:preview       # → http://localhost:3000
```

### Option B — Local Postgres (fully offline)

Best when you want to hack offline or keep your DB entirely on your machine. Requires Homebrew on macOS.

```bash
git clone <your-repo-url> lean-ledger
cd lean-ledger

# Install Postgres 16 (one-time)
brew bundle           # reads ./Brewfile → installs postgresql@16
# (or directly: brew install postgresql@16)

# Start the server (one-time; survives reboots)
brew services start postgresql@16

# Update the path and reload the .zshrc in the current terminal
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Create the database (one-time)
createdb lean_ledger

# Set the connection string and initialize
cp .env.example .env.local
echo "DATABASE_URL=postgresql://localhost:5432/lean_ledger" >> .env.local
npm install
npm run init-db:local
npm run dev:local      # → http://localhost:3000
```

Connecting to your local DB with `psql`:

```bash
psql lean_ledger        # interactive shell
# Inside psql:  \dt     (list tables)  \q (quit)
```

To wipe and rebuild:

```bash
dropdb lean_ledger && createdb lean_ledger && npm run init-db:local
```

To stop the server when you're done:

```bash
brew services stop postgresql@16
```

## Common workflows

### Local Postgres

```bash
npm run dev:local
npm run init-db:local
```

Uses `.env.local` and should point at your local Postgres instance.

### Neon preview / QA

```bash
vercel env pull .env.preview.local
npm run dev:preview
npm run init-db:preview
```

Uses `.env.preview.local` and should point at a dedicated Neon preview branch or database.
In practice, Preview env pulls usually work correctly through `vercel env pull`.
If Vercel Preview Deployment Protection is enabled, add `VERCEL_AUTOMATION_BYPASS_SECRET` to GitHub repo secrets so post-deploy smoke tests and Playwright can reach the protected preview URL.

### Neon production

```bash
npm run dev:prod
npm run init-db:prod
```

Uses `.env.production.local` for careful local verification only. Do not point preview and production at the same Neon branch or database.
If Production uses Vercel integration-managed Neon secrets, `vercel env pull` may create the file but leave values blank. In that case, create `.env.production.local` manually from Neon Connection Details instead of relying on CLI export.

### Vercel safety warning

Do not run `npm run init-db` during a Vercel build.

Builds should not mutate schema because that can:

- apply schema changes to the wrong database
- cause preview and production env mixups
- mutate production during what should be a read/build-only phase

Use migrations or init commands as deliberate operational steps outside the Vercel build itself.

### USDA Food API key (optional)

The food search uses OpenFoodFacts as the primary source (no key needed). USDA FoodData Central is the fallback for items with zero OpenFoodFacts results. To enable it:

1. Go to **https://fdc.nal.usda.gov/api-guide.html**
2. Click **Sign Up for an API Key** — enter your name and email, key is emailed instantly
3. Add to `.env.local` for local dev:
   ```
   USDA_FOOD_API_KEY=your_key_here
   ```
4. Add to Vercel for deployed environments: **Project Settings → Environment Variables → Add** `USDA_FOOD_API_KEY`, scoped to Production (and Preview if desired)

The key is free, requires no billing info, and allows 1,000 requests/hour. The app works without it — food search still returns OpenFoodFacts results.

### Protected preview and production verification

The CI workflow supports Vercel Deployment Protection bypass for automation.

Required GitHub secrets for full hosted verification:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `VERCEL_AUTOMATION_BYPASS_SECRET`

If `VERCEL_AUTOMATION_BYPASS_SECRET` is missing, protected post-deploy smoke/E2E checks are skipped rather than failing on Vercel auth. That keeps CI green, but it is not full deployed-app coverage.

### Confirm which DB you're connected to

```bash
psql "$(grep DATABASE_URL .env.local | cut -d= -f2-)" -c '\conninfo'
```

## Stack

| Layer        | Choice                                    |
|--------------|-------------------------------------------|
| Framework    | Next.js 15 (App Router, JavaScript)       |
| UI           | React 18 + custom CSS                     |
| Charts       | Recharts                                  |
| Database     | Neon Postgres via `@neondatabase/serverless` |
| Tests        | Vitest                                    |
| Deploy       | Vercel + Neon integration                 |

## Project layout

```
app/
├── api/                  Route handlers (Next.js App Router)
│   ├── profile/          GET, POST
│   ├── meals/            GET, POST (+ [id] for PUT, DELETE)
│   ├── weight/           GET, POST (upsert by user+date)
│   ├── health-metrics/   GET, POST (+ import for CSV batch upsert)
│   ├── stats/daily/[date]
│   ├── stats/trends
│   └── health
├── {/, meals, weight, health, trends, profile}/page.jsx
├── layout.jsx
└── globals.css
components/                React components (Header, MacroCard, Modal, ...)
lib/
├── models/                DB access (user, meal, weight) — async, libSQL/Postgres
├── utils/                 Pure helpers (date, unit, macro formulas)
├── db.js                  Neon client (tagged-template sql)
├── schema.sql             Postgres schema (idempotent)
├── auth.js                Multi-tenancy seam — see ROADMAP.md
├── macroCalculator.js     BMR / TDEE / macro math (Mifflin-St Jeor)
├── profile.js             enrichProfile, validateProfilePayload
├── api.js                 Client-side fetch wrapper
└── foodLookup.js          External food/barcode lookup (partial)
__tests__/                 Vitest unit tests (48 tests)
scripts/
├── init-db.mjs            One-shot schema initializer
└── smoke-test.mjs         End-to-end API smoke against any URL
docs/                      Design notes for partially-built features
ROADMAP.md                 Future work — auth/multi-tenancy plan
```

## How macros are calculated

1. **BMR** (Mifflin-St Jeor): `10·weight(kg) + 6.25·height(cm) – 5·age + constant`
2. **TDEE**: `BMR × activity multiplier` (sedentary 1.2 → very_active 1.9)
3. **Target calories**: TDEE − 500 (lose), TDEE (maintain), TDEE + 300 (gain)
4. **Macro split**: protein/fat/carbs ratios vary by goal (e.g. 35/25/40 for loss)

See `lib/macroCalculator.js`. Pure JS, no DB — fully covered by unit tests.

## Family profiles

Multiple people can share one account as a **household** — each profile keeps
its own meals, weight, habits, and age-appropriate coaching. Switch profiles
from the header; manage them at `/household`. See
[`docs/family-profiles.md`](docs/family-profiles.md) for the model, API, and the
per-profile isolation / youth-safety guarantees.

## Testing

```bash
npm test
npm run test:coverage
npm run test:e2e
npm run smoke -- http://localhost:3000   # end-to-end against running server
npm run smoke -- https://your.vercel.app # end-to-end against production
```

GitHub Actions workflows are checked in CI with `actionlint`.
To run the same workflow lint locally with Docker:

```bash
docker run --rm -v "$(pwd):/repo" --workdir /repo rhysd/actionlint:1.7.12 -color
```

Pre-deploy: run unit tests, coverage, build, smoke, Playwright, and workflow linting when CI files change.
Post-deploy: run read-only smoke and Playwright against the live URL.

## Deploy to Vercel

The repo now includes:

- versioned DB migrations via `npm run migrate-db`
- GitHub Actions CI/CD workflows for preview and production
- daily production DB backup workflow

See [docs/deployment.md](./docs/deployment.md) for:

- one-time local Postgres -> Neon production migration
- helper scripts for export, restore, and copy
- required GitHub and Vercel secrets
- preview vs production DB layout
- rollback and restore playbook
- post-deploy verification

Recommended Vercel database setup:

- Preview `DATABASE_URL`: Neon preview connection string
- Production `DATABASE_URL`: Neon production connection string

Keep them separate. Preview should never point at the same database as production.

## API surface

| Method | Path                          | Body / Query                          |
|--------|-------------------------------|---------------------------------------|
| GET    | `/api/profile`                | —                                     |
| POST   | `/api/profile`                | `{age, height, weight, gender, activityLevel, goal, units?, customMacros?}` |
| GET    | `/api/meals`                  | `?date=YYYY-MM-DD` or `?startDate&endDate` |
| POST   | `/api/meals`                  | `{date, mealName, protein, fat, carbs, calories}` |
| PUT    | `/api/meals/:id`              | `{mealName, protein, fat, carbs, calories}` |
| DELETE | `/api/meals/:id`              | —                                     |
| GET    | `/api/weight`                 | `?limit=30` or `?startDate&endDate`   |
| POST   | `/api/weight`                 | `{date, weight}`                      |
| GET    | `/api/health-metrics`         | `?limit=30` or `?startDate&endDate`   |
| POST   | `/api/health-metrics`         | `{recordedAt, ...optionalMetrics}`    |
| POST   | `/api/health-metrics/import`  | `{rows: [{recordedAt, ...optionalMetrics}]}` |
| GET    | `/api/stats/daily/:date`      | —                                     |
| GET    | `/api/stats/trends`           | `?startDate&endDate`                  |
| GET    | `/api/health`                 | —                                     |

## What's next

See [ROADMAP.md](./ROADMAP.md). Top priority: real multi-tenancy via Auth.js + Google. The schema and route handlers are already auth-ready — the work is wiring up the sign-in flow.

## License

MIT — see `LICENSE`.
