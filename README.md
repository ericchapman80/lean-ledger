# 📒 Lean Ledger

A personal macro accountability ledger. Track protein, fat, and carbs against goal-based targets calculated from your stats using the Mifflin-St Jeor equation.

Single Next.js 15 app deployed to Vercel, with Postgres for persistence.

The DB driver (`postgres` package, porsager) speaks the standard Postgres wire protocol, so **the exact same code runs against either Neon (cloud) or a local Postgres install** — only the `DATABASE_URL` differs.

## Setup

Pick one of two paths. Both end with `npm run dev` on http://localhost:3000.

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
npm run init-db        # create schema on the dev branch
npm run dev            # → http://localhost:3000
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
npm run init-db
npm run dev            # → http://localhost:3000
```

Connecting to your local DB with `psql`:

```bash
psql lean_ledger        # interactive shell
# Inside psql:  \dt     (list tables)  \q (quit)
```

To wipe and rebuild:

```bash
dropdb lean_ledger && createdb lean_ledger && npm run init-db
```

To stop the server when you're done:

```bash
brew services stop postgresql@16
```

## Common workflows (mixing local + Neon)

Both setups use the same driver and code path — only `DATABASE_URL` differs. Swap `.env.local` to switch.

### Offline (plane, café, etc.) — point at local Postgres

```bash
echo "DATABASE_URL=postgresql://localhost:5432/lean_ledger" > .env.local
npm run dev
```

### Share data across machines — point at a Neon dev branch

```bash
# .env.local
DATABASE_URL=postgresql://neondb_owner:...@ep-....neon.tech/neondb?sslmode=require
```

### Debug a prod issue with prod data — pull Neon's prod URL temporarily

```bash
vercel env pull .env.local        # pulls Neon prod URL from Vercel
npm run dev                       # now reading prod data
# When done, restore your dev URL or:
rm .env.local                     # forces error until you set one again
```

⚠️ Be deliberate with this one. Local dev pointed at prod can write to prod. Use `psql` read-only or a Neon **read replica branch** if you need to be safe.

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
│   ├── stats/daily/[date]
│   ├── stats/trends
│   └── health
├── {/, meals, weight, trends, profile}/page.jsx
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
npm test                          # 48 unit tests, ~300ms
npm run smoke -- http://localhost:3000   # end-to-end against running server
npm run smoke -- https://your.vercel.app # end-to-end against production
```

Pre-deploy: run `npm test` (CI-ready).
Post-deploy: run `npm run smoke` against the live URL.

## Deploy to Vercel

1. Push the repo to GitHub
2. In Vercel: **Import Project** → select the repo (Next.js auto-detected)
3. Add the Neon integration: Vercel dashboard → **Storage** → connect existing Neon project → this auto-injects `DATABASE_URL` into the project's environment variables
4. **Deploy**
5. Initialize the production schema (one-time):
   ```bash
   vercel env pull .env.local    # pulls DATABASE_URL locally
   npm run init-db                # creates tables against production DB
   ```
6. Verify with the smoke test:
   ```bash
   npm run smoke -- https://your-app.vercel.app
   ```

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
| GET    | `/api/stats/daily/:date`      | —                                     |
| GET    | `/api/stats/trends`           | `?startDate&endDate`                  |
| GET    | `/api/health`                 | —                                     |

## What's next

See [ROADMAP.md](./ROADMAP.md). Top priority: real multi-tenancy via Auth.js + Google. The schema and route handlers are already auth-ready — the work is wiring up the sign-in flow.

## License

MIT — see `LICENSE`.
