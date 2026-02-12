# Local DB Runbook (A1-A6)

This runbook is the shortest path to a working local setup for database + seed + Gemini key.

## A1. Pull real environment variables

At repo root:

```bash
vercel env pull .env.local
```

Expected minimum variables:
- `DATABASE_URL`
- `POSTGRES_URL_NON_POOLING`
- `DIRECT_URL` (only if referenced in `prisma/schema.prisma`)
- `ADA_ENCRYPTION_KEY`
- `GEMINI_API_KEY` (optional for lexical-only search; warning only in doctor)

## A2. Load variables in current shell

```bash
set -a
source .env.local
set +a
```

## Minimum viable env

For a local setup that can migrate/seed and run search in lexical-only mode:

- `ADA_ENCRYPTION_KEY` must be set
- `DATABASE_URL` must point to local Postgres
- `POSTGRES_URL_NON_POOLING` should be set (often same value as `DATABASE_URL` locally)
- `GEMINI_API_KEY` can be absent for now (doctor prints WARN, not KO)

Example (local, no `sslmode=require`):

```bash
ADA_ENCRYPTION_KEY="dev-local-key-change-me"
DATABASE_URL="postgresql://app_user:app_password@localhost:5432/acces_direct_aide"
POSTGRES_URL_NON_POOLING="postgresql://app_user:app_password@localhost:5432/acces_direct_aide"
```

## A3. Run doctor and fix KO reasons

```bash
npm run doctor
```

Doctor output:
- `RESULT: OK`: setup ready
- `RESULT: KO`: at least one blocking issue (missing var, placeholder, bad URL, unreachable TCP)

Common fixes:
- Pull env again: `vercel env pull .env.local`
- Replace placeholders (`HOST`, `USER`, `PASSWORD`, `...`)
- Use a valid Postgres URL format: `postgresql://user:password@host:5432/dbname?sslmode=require`

## A4. Validate DB auth with psql (safe key=value form)

Use the `psql` command printed by `npm run doctor` (password intentionally not shown).

Example:

```bash
psql "host=<host> port=<port> dbname=<dbname> user=<user> sslmode=<mode>" -c "select current_user, current_database();"
```

If needed:
- export password in shell before running psql
- use direct endpoint for migrations (non-pooler)

## A5. Apply migrations and seed

```bash
npm run db:migrate
npm run db:seed
```

DB checks (table is `"Aide"`, not `"Aid"`):

```bash
psql "host=<host> port=<port> dbname=<dbname> user=<user> sslmode=<mode>" -c 'select count(*) from "Aide";'
psql "host=<host> port=<port> dbname=<dbname> user=<user> sslmode=<mode>" -c "select column_name from information_schema.columns where table_schema='public' and table_name='Aide' and column_name='quality_score';"
```

## A6. Final verification

Run again:

```bash
npm run doctor
```

Then optional checks:

```bash
npm run lint
npm run typecheck
npm test
```

Definition of done:
- `npm run doctor` => `RESULT: OK`
- migrations + seed run without errors
