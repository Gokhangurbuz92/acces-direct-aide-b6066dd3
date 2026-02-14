# Test DB Runbook (Issue #140)

Goal: run `npm test` against a dedicated, fully local Postgres database that is reset deterministically (no Neon/Vercel DB, no external state).

## 1) Create a local test database

Create a database whose name contains `test` (guard rail):

```bash
createdb acces_direct_aide_test
```

## 2) Provide `DATABASE_URL_TEST`

Create a local-only env file (gitignored):

```bash
cat > .env.test.local <<'EOF'
DATABASE_URL_TEST="postgresql://YOUR_USER@localhost:5432/acces_direct_aide_test?schema=public"
EOF
```

Notes:
- Use a **local** host only: `localhost` / `127.0.0.1` / `::1`
- The test runner refuses to run if the DB name does not include `"test"`.

## 3) Ensure required Postgres extensions

The test DB must support:
- `unaccent`
- `pg_trgm`
- `vector` (pgvector)

If you run Postgres locally (Homebrew), you need pgvector installed for your Postgres version.

If you prefer Docker, use a pgvector-enabled image (example):
- image: `pgvector/pgvector:pg16`

## 4) Run tests (deterministic)

```bash
npm test
```

What happens:
- reset schema (`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`)
- create required extensions
- `prisma db push` (schema from `prisma/schema.prisma`)
- `prisma db seed` (deterministic timestamps when `NODE_ENV=test`)
- run `vitest`

Repeat stability check:

```bash
npm run test:repeat
```

