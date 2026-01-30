# CLAUDE.md

## Project Overview
**Dominia**: A learning project for building CRUD applications.
- **Stack**: Hono (JSON API), Drizzle ORM, Neon (Postgres), Vitest (Cloudflare Workers).
- **Env**: Local (Docker/Caddy) and Production (Cloudflare/Neon).

## File Structure
src/
├── routes/
│   └── share/
│       ├── index.ts          # PWA share_target endpoint
│       ├── index.test.ts     # Colocated integration tests
│       └── schema.ts         # Zod schemas for share route
├── db/
│   ├── client.ts         # DB connection (Local/Remote auto-switch)
│   ├── schema.ts         # Drizzle schema definition
│   └── migrations/       # SQL migration files
├── index.ts              # Hono app entry (mounts routes)
└── types.ts              # Zod schemas & Env types
test/
└── env.d.ts              # Test type definitions
scripts/                  # Utilities (db-clean, db-truncate, env-gen)
docker/                   # Local dev infrastructure (Caddy, Postgres)
docs/                     # Detailed architecture docs (See below)
wrangler.jsonc            # Cloudflare Workers config
lefthook.yml              # Git hooks configuration

## Commands
- **Dev**: `npm run dev` (Starts Vite server)
- **Build/Deploy**: `npm run build` / `npm run deploy`
- **Database**:
  - Migrate: `npm run db:migrate` (Dev) / `npm run db:migrate:test` (Test)
  - Truncate: `npm run db:truncate` (テーブル内容のみクリア)
  - Reset: `npm run db:clean` (テーブルドロップ)
- **Test**: `npm test` (Runs sequentially for DB safety)
- **Type/Env**: `npm run hono:env` (Sync .env -> .dev.vars)

## Documentation & Architecture
Refer to `docs/` for complex logic details:
- **Architecture**: `docs/architecture.md` (DB Connection Strategy, Dual Env Config)
- **Testing**: `docs/testing.md` (Mocking strategy, Workers environment)

## Routing Organization
Routes are organized using Hono's `app.route()` pattern for scalability:
- **Sub-apps**: Each resource (share, etc.) has its own sub-app in `src/routes/{resource}/index.ts`
- **Type Safety**: All sub-apps use `new Hono<{ Bindings: Bindings }>()` for proper type inference
- **Adding Routes**:
  1. Create `src/routes/{resource}/index.ts` with a Hono sub-app
  2. Mount in `src/index.ts`: `app.route("/{resource}", resourceApp)`

## Development Rules
1. **Lefthook & Git Hooks**:
   - Biome (Format/Lint) and Vitest run on commit/push.
   - **If `git commit` fails**: Read the error, **fix the code automatically**, and retry the commit.
2. **Database**: Always use Drizzle Kit for schema changes.
3. **Tests**: Use `npm test` to ensure DB isolation protocols are respected.
4. **Routing**: Follow the established pattern in `src/routes/` for consistency.