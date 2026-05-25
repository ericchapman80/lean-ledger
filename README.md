# 📒 Lean Ledger

A personal macro accountability ledger. Track protein, fat, and carbs against goal-based targets calculated from your stats using the Mifflin-St Jeor equation.

Single Next.js 15 app deployed to Vercel, with Postgres for persistence.

The DB driver (`postgres` package, porsager) speaks the standard Postgres wire protocol, so **the exact same code runs against either Neon (cloud) or a local Postgres install** — only the `DATABASE_URL` differs.

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

## Testing

```bash
npm test
npm run test:coverage
npm run test:e2e
npm run smoke -- http://localhost:3000   # end-to-end against running server
npm run smoke -- https://your.vercel.app # end-to-end against production
```

Pre-deploy: run unit tests, coverage, build, smoke, and Playwright.
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
