# Database Migrations & Management

This document outlines the strategy for managing database schema changes and performance in the `acces-direct-aide` project.

## Workflow

### 1. Local Development
When you need to modify the database schema:
1. Edit `prisma/schema.prisma`.
2. Run `npm run db:migrate` (which calls `prisma migrate dev`).
   - This command will prompt you for a name for the migration.
   - It will apply the change to your local database and generate a SQL migration file in `prisma/migrations/`.
3. If you need to seed the database with test data, run `npm run db:seed`.

### 2. Staging & Production
Deployments to Staging and Production trigger the `db:deploy` command (via Vercel or CI pipeline).
- `npm run db:deploy` (calls `prisma migrate deploy`) applies all pending migrations from `prisma/migrations/` to the database.
- **Important:** Never edit the `prisma/migrations` files manually or delete them after they have been deployed.

## Scripts

- `npm run db:migrate`: Creates a new migration based on schema changes and applies it (Development only).
- `npm run db:deploy`: Applies pending migrations to the database (Staging/Production).
- `npm run db:seed`: Seeds the database with initial/test data defined in `prisma/seed.js`.

## Seeding
The seed script (`prisma/seed.js`) populates the database with a minimal dataset:
- 10 Aides
- 10 Démarches
- 20 Structures
- 10 Actualités

This is useful for initializing a fresh Staging environment or for local development.

## Rollback Strategy

Prisma does not have a built-in "down" migration command. To rollback a change:

1. **Revert the Schema:** Revert the changes in `prisma/schema.prisma` to the previous state.
2. **Create Revert Migration:** Run `npm run db:migrate` again.
   - Name the migration something like `revert_feature_x`.
   - This generates a SQL migration that undoes the changes.
3. **Deploy:** Commit and push. The `revert_feature_x` migration will be applied during deployment, effectively rolling back the database structure.

### Critical Migrations
For risky or complex migrations (e.g., massive data changes):
1. Test thoroughly on a Staging database copy.
2. Consider a "Expand and Contract" strategy (add new column, backfill, switch code, remove old column) to avoid downtime.
