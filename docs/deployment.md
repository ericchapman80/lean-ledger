# Deployment and Production Migration

This repo now supports:

- versioned DB migrations via `npm run migrate-db`
- CI gating for unit tests, coverage, build, audit, API smoke, and Playwright
- Vercel preview deploys for PRs and production deploys for `main`
- post-deploy smoke and browser checks
- daily logical backups for the production database

## Build In Quality Default

This project treats **build in quality** as the default delivery stance.

In practice that means:

- feature work is not considered done without the right test coverage
- logic-heavy changes should add or update unit tests
- multi-page or user-flow changes should add or update functional/E2E coverage when practical
- schema changes should ship with safe migrations, rollout order, and verification steps
- preview and production checks should stay part of the standard path to `main`

Quality should be part of implementation, not deferred to a later cleanup pass.

## 1. Recommended Environment Layout

Use one env file per local workflow and one database target per hosted environment:

- `.env.local`: local Postgres
- `.env.preview.local`: Neon preview / QA
- `.env.production.local`: Neon production for careful local verification only

Hosted environments:

- Vercel Preview: Neon preview connection string
- Vercel Production: Neon production connection string

Do not point Vercel Preview at the production database. Do not point preview and production at the same Neon branch or database.

Recommended local commands:

```bash
npm run dev:local
npm run dev:preview
npm run dev:prod

npm run init-db:local
npm run init-db:preview
npm run init-db:prod
```

`init-db:prod` requires explicit confirmation. Use it carefully.

## 2. GitHub and Vercel Secrets

Add these GitHub repository secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `VERCEL_AUTOMATION_BYPASS_SECRET`
- `PROD_DATABASE_URL`

`PROD_DATABASE_URL` is only for the daily backup workflow. It should be the Neon production connection string.

`VERCEL_AUTOMATION_BYPASS_SECRET` is used by post-deploy smoke tests and Playwright checks when Vercel Deployment Protection is enabled on Preview or Production. Without it, the workflows skip protected post-deploy browser checks instead of failing on a Vercel auth wall.

Add this GitHub repository variable:

- `PRODUCTION_BASE_URL`

Set `PRODUCTION_BASE_URL` to your stable production URL, for example `https://app.example.com`. Production post-deploy checks and rollback verification will hit that URL when it is set. If it is blank, the workflows fall back to the direct Vercel deployment URL.

In Vercel, set:

- `DATABASE_URL` for the `Preview` environment to the Neon preview branch
- `DATABASE_URL` for the `Production` environment to the Neon production branch

If Deployment Protection is enabled in Vercel, also create a Protection Bypass secret for automation and store that same value in the GitHub repository secret `VERCEL_AUTOMATION_BYPASS_SECRET`.

Recommended protected-preview setup:

1. in Vercel, open the `lean-ledger` project
2. go to the Deployment Protection settings for Preview
3. create or copy the automation bypass secret
4. in GitHub, save it as `VERCEL_AUTOMATION_BYPASS_SECRET`
5. rerun a PR pipeline and confirm `preview-post-deploy` executes smoke/E2E checks instead of skipping

To refresh a local preview env file from Vercel:

```bash
vercel env pull .env.preview.local
```

Preview env pulls typically work correctly through the Vercel CLI and are the recommended way to sync your local QA/preview file.

Production can behave differently when the database is attached through a Vercel-managed Neon integration:

- the Production env vars can be present and populated in the Vercel UI
- Vercel runtime injection can still work correctly in hosted deploys
- `vercel env pull` may still export blank values for those Production integration-managed secrets

If that happens, build `.env.production.local` manually from Neon Connection Details instead of relying on CLI export.

GitHub Actions handles this differently from local verification:

- preview deploys normalize `DATABASE_URL` from the pulled Vercel env file
- production deploys first try the pulled Vercel env file, then fall back to the GitHub secret `PROD_DATABASE_URL` if Vercel exports blank integration-managed values

That fallback is intentional for CI only. It prevents production migrations from failing when Vercel runtime secrets exist but `vercel pull --environment=production` exports empty DB values.

If you move deployment ownership to GitHub Actions, disable Vercel's automatic Git-based production deployment to avoid duplicate deploys.

## 3. One-Time Local Postgres -> Neon Production Migration

Assumptions:

- local data already exists in your local Postgres database
- Neon production DB is new or intentionally empty
- you want schema from code, data from local

### 3.1. Run the production schema first

```bash
DATABASE_URL="postgresql://<neon-prod-url>" npm run migrate-db
```

### 3.2. Export local data

Use a data-only custom dump so sequence values come across cleanly without overwriting the target schema:

```bash
LOCAL_DATABASE_URL="postgresql://localhost:5432/lean_ledger"

pg_dump "$LOCAL_DATABASE_URL" \
  --format=custom \
  --data-only \
  --no-owner \
  --no-privileges \
  --exclude-table=schema_migrations \
  --file=lean-ledger-data.dump
```

Equivalent helper script:

```bash
SOURCE_DATABASE_URL="$LOCAL_DATABASE_URL" \
TARGET_DATABASE_URL="$NEON_PROD_DATABASE_URL" \
npm run db:copy
```

That helper performs the export and restore steps below automatically after you have already migrated the target schema.

### 3.3. Import into Neon production

```bash
NEON_PROD_DATABASE_URL="postgresql://<neon-prod-url>"

pg_restore \
  --data-only \
  --no-owner \
  --no-privileges \
  --single-transaction \
  --dbname="$NEON_PROD_DATABASE_URL" \
  lean-ledger-data.dump
```

### 3.4. Verify the migrated production DB

```bash
DATABASE_URL="$NEON_PROD_DATABASE_URL" npm run migrate-db
npm run smoke -- https://<your-production-url> --read-only
PLAYWRIGHT_BASE_URL="https://<your-production-url>" npm run test:e2e
```

## 4. Preview Database Setup

Create a dedicated Neon preview branch or database and set that URL as Vercel Preview `DATABASE_URL`.

Recommended:

1. create a `preview` Neon branch from production after the initial prod migration
2. use that branch as the Vercel Preview database
3. periodically reset or re-branch preview if test data becomes noisy

### Preview protection and post-deploy verification

When Preview Deployment Protection is enabled, GitHub Actions cannot hit the deployed preview app unless `VERCEL_AUTOMATION_BYPASS_SECRET` is configured. The workflow behavior is:

- secret present: post-deploy smoke and Playwright checks run against the protected preview URL
- secret missing: post-deploy smoke and Playwright checks are skipped with a workflow summary note

This prevents false CI failures from Vercel auth, but it also means you do not have true preview browser verification until the secret is configured.

## 5. Local and CI Migration Commands

Local bootstrap:

```bash
npm run init-db
```

Environment-specific bootstrap:

```bash
npm run init-db:local
npm run init-db:preview
npm run init-db:prod
```

Recommended local env sync workflow:

```bash
vercel env pull .env.preview.local --environment=preview
```

And for production, if the CLI exports blank values:

1. open Neon
2. go to the production project or branch connection details
3. copy the production connection string manually
4. place it in `.env.production.local`

### Carb-detail rollout order

Use this order when rolling out the `fiber` and `sugar_alcohols` schema update:

1. run `npm run init-db:local`
2. run `npm test`
3. run `npm run build`
4. run `npm run init-db:preview`
5. verify the Vercel Preview deployment
6. run `npm run init-db:prod` intentionally
7. deploy production

Existing `meals.carbs` values remain total carbs. The new `fiber` and `sugar_alcohols` columns are nullable, and net carbs are derived dynamically:

```sql
greatest(carbs - coalesce(fiber, 0) - coalesce(sugar_alcohols, 0), 0)
```

No destructive rename or drop is required.

Formal migration command:

```bash
npm run migrate-db
```

`init-db` now delegates to the migration runner so local, CI, preview, and production use the same path.

### Important build safety warning

Do not run `npm run init-db` during a Vercel build.

Reasons:

- builds should not mutate schema
- preview and production envs are easy to mix up if schema mutation is hidden inside build
- accidental production schema changes become much harder to reason about and roll back

Run schema changes as deliberate migration/init steps, not as part of the build command.

### Verification queries

Confirm the new columns exist:

```sql
select column_name, data_type
from information_schema.columns
where table_name = 'meals'
and column_name in ('fiber', 'sugar_alcohols');
```

Check recent meal values and derived net carbs:

```sql
select id, meal_name, carbs, fiber, sugar_alcohols,
greatest(carbs - coalesce(fiber, 0) - coalesce(sugar_alcohols, 0), 0) as net_carbs
from meals
order by created_at desc
limit 20;
```

## 6. What the Pipeline Does

For every PR:

1. run `npm ci`
2. run `npm run migrate-db` against ephemeral Postgres
3. run `npm run test:coverage`
4. run `npm run build`
5. run `npm audit --audit-level=high`
6. run local API smoke tests
7. run local Playwright browser tests
8. deploy a Vercel preview
9. run read-only smoke tests against the deployed preview
10. run read-only Playwright tests against the deployed preview

For every push to `main`:

1. repeat the same validation
2. migrate the production database
3. deploy to Vercel production
4. run read-only smoke tests against production
5. run read-only Playwright tests against production

## 7. Daily Backups

The `Database Backup` workflow runs daily and stores:

- a custom-format dump
- a matching `.sha256` checksum file

Artifacts are retained in GitHub Actions for 30 days.

This is a logical backup layer. Keep Neon backups/PITR enabled as well.

## 8. Rollback and Restore Playbook

### 8.1. Fast application-only rollback

If the issue is application code only and the production database is still valid:

1. open GitHub Actions
2. run `Rollback Production`
3. set `git_ref` to the known-good commit, tag, or branch
4. leave `restore_database=false`

This redeploys the chosen ref to production and runs read-only smoke and browser checks.

### 8.2. Full rollback with database restore

If the release included a bad data migration or data corruption:

1. locate the backup artifact in the `Database Backup` workflow
2. note:
   - `backup_run_id`
   - `backup_artifact_name`
3. run `Rollback Production`
4. set:
   - `git_ref` to the known-good application ref
   - `restore_database=true`
   - `backup_run_id`
   - `backup_artifact_name`

The workflow will:

1. download the chosen backup artifact
2. restore it into the production database
3. run migrations from the rollback ref
4. redeploy production
5. run post-rollback smoke and Playwright checks

### 8.3. Manual restore from a local machine

If you want to restore manually instead of using GitHub Actions:

```bash
DATABASE_URL="postgresql://<neon-prod-url>" npm run db:restore -- ./lean-ledger-prod-<timestamp>.dump
DATABASE_URL="postgresql://<neon-prod-url>" npm run migrate-db
```

## 9. Coverage and Security Gates

Vitest coverage thresholds are enforced on the `lib/` logic layer:

- lines: `80%`
- functions: `80%`
- statements: `80%`
- branches: `75%`

Security gate:

- `npm audit --audit-level=high`

That fails the pipeline on `high` or `critical` advisories.
