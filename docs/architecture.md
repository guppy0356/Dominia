# Architecture Documentation

## Database Connection Strategy

The project handles database connections differently for local development and production to support the Neon serverless environment.

### Connection Logic
The `createDrizzleClient()` function in `src/db/client.ts` manages the connection:

* **Production**: Connects directly to Neon serverless Postgres.
* **Local Development**: Uses `.localtest.me` domains with a custom WebSocket proxy on port `4444`.
    * This mimics the Neon environment locally using Docker.
    * `neonConfig` is automatically configured based on hostname detection.

## Dual Environment Configuration

The project maintains strict separation between development and test environments to prevent data conflicts.

### 1. Environment Files
* **Dev**: `.env` is the source. It generates `.dev.vars` for the Workers runtime.
* **Test**: `.env.test` is the source. It generates `.dev.vars.test`.

> **Note:** Always use `npm run hono:env` to sync changes from `.env` to `.dev.vars`. This script validates variables against the Zod schema in `src/types.ts`.

### 2. Drizzle Configuration
* `drizzle.config.ts`: Single config file used for both dev and test
* Environment variables are loaded via `dotenv-cli` in npm scripts:
    * Dev: `npx dotenv -e .env -- drizzle-kit migrate`
    * Test: `npx dotenv -e .env.test -- drizzle-kit migrate`

### 3. Wrangler Environments
* **Default**: Used for development and production deployments.
* **Test**: A specific environment defined in `wrangler.jsonc` for running tests.

## Type-Safe Environment Variables

Environment variables are defined and validated using **Zod** in `src/types.ts`.

* **Validation**: The `envSchema.parse()` method validates variables at runtime.
* **Type Generation**: `npm run cf-typegen` generates Cloudflare bindings types from `wrangler.jsonc`.
* **Key Variables**:
    * `DATABASE_URL`: Postgres connection string (Required).

## Hono App Structure

* **Entry Point**: `src/index.ts` exports the Hono app instance and mounts route sub-apps.
* **API Design**: Endpoints return JSON or HTML responses depending on the use case.
* **Dependency Injection**: The Database client is instantiated **per-request** via `createDrizzleClient(c.env.DATABASE_URL)` to ensure the correct environment variables are used.

## Routing Organization

Routes are organized using Hono's `app.route()` pattern for scalability and maintainability.

### Directory Structure

```
src/
├── routes/
│   └── {resource}/
│       ├── index.ts        # Sub-app for each resource
│       ├── schema.ts       # Zod validation schemas
│       └── index.test.ts   # Colocated integration tests
└── index.ts                # Main app (mounts routes)
```

### Sub-Apps Pattern

Each resource (e.g., `share`) has its own **sub-app**:

* **Location**: `src/routes/{resource}/index.ts`
* **Structure**: Exports a Hono instance with resource-specific routes
* **Mounting**: Main app uses `app.route("/{resource}", subApp)` to mount

**Example** (`src/routes/share/index.ts`):
```typescript
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { Bindings } from "@/types";
import { shareQuery } from "./schema";

const app = new Hono<{ Bindings: Bindings }>();
app.get("/", zValidator("query", shareQuery), async (c) => { /* handler */ });
export default app;
```

### Type Safety Requirements

All sub-apps **must** declare the same type parameter as the main app:

```typescript
new Hono<{ Bindings: Bindings }>()
```

This ensures:
* `c.env.DATABASE_URL` is properly typed as `string`
* Full type inference across all routes

### Adding New Routes

To add a new resource:

1. Create `src/routes/{resource}/index.ts`
2. Define a Hono sub-app with `new Hono<{ Bindings: Bindings }>()`
3. Add route handlers and middleware
4. Mount in `src/index.ts`: `app.route("/{resource}", resourceApp)`

**Benefits**:
* Clear separation of concerns
* Easy to locate and modify routes
* Scalable for growing applications
* Type-safe across all modules

## Database Schema Management

* **Definition**: Schema is defined in `src/db/schema.ts` using Drizzle ORM.
* **Migrations**: Stored in `src/db/migrations/`.
* **Workflow**:
    1.  Modify `src/db/schema.ts`.
    2.  Generate migration: `npx drizzle-kit generate`.
    3.  Apply migration: `npm run db:migrate`.

### Validation Layer with drizzle-zod

The project uses a two-layer schema approach:

1. **Database Schema** (`src/db/schema.ts`): Drizzle ORM table definitions
2. **Validation Schema** (`src/routes/{resource}/schema.ts`): Zod schemas for runtime validation

**drizzle-zod Integration**:
* Generates base Zod schemas automatically from Drizzle table definitions
* Extended with additional validation rules (e.g., URL format validation)
* Provides type inference for TypeScript types

**Example** (`src/routes/share/schema.ts`):
```typescript
/** HTTP(S) URL validator */
const httpUrl = z.string().refine((url) => {
  const parsed = new URL(url);
  return parsed.protocol === "http:" || parsed.protocol === "https:";
});

export const shareQuery = z.object({
  url: httpUrl.optional(),
  text: z.string().optional(),
  title: httpUrl.optional(),
});
```

**Benefits**:
* Single source of truth (Drizzle schema)
* Automatic type safety from database to API
* Runtime validation prevents invalid data from reaching clients
* Colocated with routes for better organization