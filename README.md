# 📒 Lean Ledger

A personal macro accountability ledger. Track protein, fat, and carbs against goal-based targets calculated from your stats using the Mifflin-St Jeor equation.

Single Next.js 15 app deployed to Vercel, with Neon Postgres for persistence.

## Quick start (local)

```bash
git clone <your-repo-url> lean-ledger
cd lean-ledger
cp .env.example .env.local        # paste your Neon DATABASE_URL
npm install
npm run init-db                   # create/update schema
npm run dev                       # http://localhost:3000
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
