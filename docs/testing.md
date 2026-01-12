# Testing Documentation

## Overview

Tests are executed using **Vitest** with `@cloudflare/vitest-pool-workers`. This allows tests to run within a simulated Cloudflare Workers environment, ensuring high fidelity with production behavior.

## Testing Architecture

### Environment Configuration
Tests require proper environment variables to be set in `.env.test`:
* **`DATABASE_URL`**: Test database connection (configured via Docker)
* **`JWKS_URI`**: Mock JWKS endpoint URL (e.g., `https://test-jwks.local/.well-known/jwks.json`)
  * Required for authentication testing
  * Must match the URL mocked in `beforeEach()` hooks
* The `.env.test` file is committed to the repository for consistent test environments

### Path Aliases
Tests use TypeScript path aliases for clean imports:
* **`@/*`**: Maps to `src/*` for application code.
* **`@test/*`**: Maps to `test/*` for test utilities (e.g., `@test/helpers/jwt`).
* **Configuration**: Defined in `tsconfig.json` and resolved via `vite-tsconfig-paths` plugin in `vitest.config.ts`.

### 1. Database Isolation strategy
To prevent data corruption and race conditions, tests run against a dedicated test database.

* **Configuration**: Tests use `DATABASE_URL` from `.env.test`.
* **Sequential Execution**: Enforced in `vitest.config.ts` via `fileParallelism: false` and `maxConcurrency: 1`.
    * *Reason*: Since we use a real Postgres instance (Neon/Docker) rather than an in-memory mock, running tests in parallel would cause database locking and data inconsistency issues.

### 2. Mocking Strategy

#### Network Requests (`fetchMock`)
We use `fetchMock` to intercept external requests.
* **Global Rule**: `fetchMock.disableNetConnect()` is enabled by default to prevent accidental external calls.
* **Exception**: Connections to the local test database (`db.localtest.me:4444`) are explicitly allowed.

#### Authentication (JWT)
Protected endpoints are tested using helper utilities in `test/helpers/jwt.ts`.
* **Helper Function**: `createJwtTestHelper()` returns a `JwtHelper` object with:
  * `publicJwk`: The public key in JWK format for JWKS mocking.
  * `createToken(payload?)`: Generates signed JWT tokens for test requests.
* **Mechanism**: Creates RSA key pairs and signs valid JWTs for testing.
* **JWKS**: The JWKS endpoint is mocked via `fetchMock` so the app can validate the test tokens without reaching out to a real provider.
  * The mock is configured dynamically from `env.JWKS_URI` to ensure consistency with environment variables:
    ```typescript
    const jwksUrl = new URL(env.JWKS_URI);
    fetchMock
      .get(jwksUrl.origin)
      .intercept({ path: jwksUrl.pathname })
      .reply(200, { keys: [jwtHelper.publicJwk] });
    ```

### Test Organization
Tests are colocated with source code for better maintainability:
* **Integration Tests**: Located in `src/routes/{resource}/index.test.ts` alongside route handlers
* **Test Helpers**: Shared utilities in `test/helpers/` (e.g., `jwt.ts`)
* **Type Definitions**: Test-specific types in `test/env.d.ts`

Example structure:
```
src/routes/entries/
├── index.ts          # Route handlers
└── index.test.ts     # Integration tests
test/
├── helpers/jwt.ts    # Shared JWT utilities
└── env.d.ts          # Test type definitions
```

## Test Utilities & Scripts

### Database Management
* **`npm run test:prepare`**: Runs migrations against the test database (using `.env.test`).
* **`npm run db:clean -- --env=test`**: Drops all tables and resets the test database.
* **`npm test`**: Runs the full test suite.

### Example Test Structure
Refer to `src/routes/entries/index.test.ts` for a complete example.

```typescript
import { createJwtTestHelper, type JwtHelper } from "@test/helpers/jwt";

let jwtHelper: JwtHelper;

beforeAll(async () => {
  jwtHelper = await createJwtTestHelper();
});

beforeEach(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
  // Allow connection to the local DB proxy
  fetchMock.enableNetConnect(/db\.localtest\.me:4444/);

  // Mock JWKS endpoint dynamically
  const jwksUrl = new URL(env.JWKS_URI);
  fetchMock
    .get(jwksUrl.origin)
    .intercept({ path: jwksUrl.pathname })
    .reply(200, { keys: [jwtHelper.publicJwk] });
});
