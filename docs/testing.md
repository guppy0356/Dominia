# Testing Documentation

## Overview

Tests are executed using **Vitest** with `@cloudflare/vitest-pool-workers`. This allows tests to run within a simulated Cloudflare Workers environment, ensuring high fidelity with production behavior.

## Testing Architecture

### Environment Configuration

Tests require proper environment variables. Configuration is managed through multiple files:

**`.env.test`** (committed to repository):
* **`DATABASE_URL`**: Test database connection (configured via Docker for local, Neon for CI)

**`.dev.vars.test`** (runtime variables for Workers):
* Generated from `.env.test` locally via `npm run hono:env`
* Generated dynamically in CI with Neon branch URL

### Path Aliases
Tests use TypeScript path aliases for clean imports:
* **`@/*`**: Maps to `src/*` for application code.
* **`@test/*`**: Maps to `test/*` for test utilities.
* **Configuration**: Defined in `tsconfig.json` and resolved via `vite-tsconfig-paths` plugin in `vitest.config.ts`.

### 1. Database Isolation Strategy
To prevent data corruption and race conditions, tests run against a dedicated test database.

* **Configuration**: Tests use `DATABASE_URL` from `.dev.vars.test`.
* **Connection Mode**: HTTP mode via `poolQueryViaFetch` for consistency between local and production environments.
* **Sequential Execution**: Enforced in `vitest.config.ts` via `fileParallelism: false` and `maxConcurrency: 1`.
    * *Reason*: Since we use a real Postgres instance (Neon/Docker) rather than an in-memory mock, running tests in parallel would cause database locking and data inconsistency issues.

### 2. Mocking Strategy

#### Network Requests (`fetchMock`)
We use `fetchMock` to intercept external requests.
* **Global Rule**: `fetchMock.disableNetConnect()` is enabled by default to prevent accidental external calls.
* **Exception**: Connections to test databases are explicitly allowed:
  * `*.localtest.me` for local Docker
  * `*.neon.tech` for CI (Neon HTTP API)

### 3. Test Data Generation
Tests use `drizzle-seed` with `@faker-js/faker` to generate realistic test data.

* **`seed(client, schema, options)`**: Populates tables with generated data
* **`reset(client, schema)`**: Clears tables between tests
* **Customization**: Use `.refine()` to customize generated values per column

```typescript
import { faker } from "@faker-js/faker";
import { reset, seed } from "drizzle-seed";

beforeEach(async () => {
  const client = createDrizzleClient(env.DATABASE_URL);
  await seed(client, { entries }, { count: 5 }).refine((f) => ({
    entries: {
      columns: {
        id: f.valuesFromArray({
          values: Array.from({ length: 10 }, () => faker.string.uuid()),
          isUnique: true,
        }),
        url: f.valuesFromArray({
          values: Array.from({ length: 10 }, () => faker.internet.url()),
        }),
      },
    },
  }));
});

afterEach(async () => {
  const client = createDrizzleClient(env.DATABASE_URL);
  await reset(client, { entries });
});
```

### Test Organization
Tests are colocated with source code for better maintainability:
* **Integration Tests**: Located in `src/routes/{resource}/index.test.ts` alongside route handlers
* **Type Definitions**: Test-specific types in `test/env.d.ts`

Example structure:
```
src/routes/share/
├── index.ts          # Route handlers
├── schema.ts         # Zod validation schemas
└── index.test.ts     # Integration tests
test/
└── env.d.ts          # Test type definitions
```

## Test Utilities & Scripts

### Database Management
* **`npm run db:migrate:test`**: Runs migrations against the test database (using `.env.test`).
* **`npm run db:truncate:test`**: Truncates all tables (faster than clean, keeps schema).
* **`npm run db:clean:test`**: Drops all tables and resets the test database.
* **`npm test`**: Runs the full test suite.

### Example Test Structure
Refer to `src/routes/share/index.test.ts` for a complete example.

```typescript
import { env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { reset } from "drizzle-seed";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDrizzleClient } from "@/db/client";
import { entries } from "@/db/schema";
import app from "@/index";

describe("GET /share", () => {
  beforeEach(async () => {
    const client = createDrizzleClient(env.DATABASE_URL);
    await reset(client, { entries });
  });

  afterEach(async () => {
    const client = createDrizzleClient(env.DATABASE_URL);
    await reset(client, { entries });
  });

  it("should save URL from url parameter", async () => {
    const testUrl = "https://example.com/page";
    const res = await app.request(
      `/share?url=${encodeURIComponent(testUrl)}`,
      {},
      env,
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");

    const client = createDrizzleClient(env.DATABASE_URL);
    const saved = await client
      .select()
      .from(entries)
      .where(eq(entries.url, testUrl));
    expect(saved).toHaveLength(1);
  });

  it("should return 400 when no valid URL found", async () => {
    const res = await app.request("/share", {}, env);
    expect(res.status).toBe(400);
  });
});
```

## CI/CD Integration

### GitHub Actions Workflows

**`quality.yml`**: Runs quality checks on pull requests
* Triggers on PR to main branch
* Runs Biome linting and TypeScript type checking
* Creates an ephemeral Neon database branch, runs tests, then cleans up
* Generates `.dev.vars.test` dynamically with Neon connection URL

### Neon Database Branches

CI uses Neon's branching feature for isolated test environments:

```yaml
- uses: neondatabase/create-branch-action@v6
  with:
    project_id: ${{ vars.NEON_PROJECT_ID }}
    parent_branch: main
    branch_name: ci/pr-${{ github.event.pull_request.number }}
    api_key: ${{ secrets.NEON_API_KEY }}
```

* **Branch naming**: `ci/pr-{number}` for easy identification
* **Automatic cleanup**: Branch deleted at the end of the test job

### Dynamic Environment Setup in CI

```yaml
- name: Create .dev.vars.test
  run: |
    cat <<EOF > .dev.vars.test
    DATABASE_URL=${{ steps.create-branch.outputs.db_url_pooled }}
    EOF
```

## Vitest Configuration

```typescript
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineWorkersConfig({
  plugins: [tsconfigPaths()],
  test: {
    fileParallelism: false,
    maxConcurrency: 1,
    globals: true,
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.jsonc", environment: "test" },
      },
    },
  },
});
```

* **`vite-tsconfig-paths`**: Resolves `@/` and `@test/` path aliases
* **`fileParallelism: false`**: Runs test files sequentially for DB safety
* **`environment: "test"`**: Uses the test environment from `wrangler.jsonc`
