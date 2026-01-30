# Dominia

A learning project for building CRUD applications with Hono + Drizzle ORM + Neon + Vitest.

## Project Structure

```
src/
├── routes/          # API routes (sub-apps)
│   └── share/       # PWA share_target endpoint
├── db/              # Database (Drizzle ORM)
├── index.ts         # App entry point
└── types.ts         # Type definitions
scripts/             # Utility scripts
docker/              # Local infrastructure
docs/                # Architecture documentation
```

## Tech Stack

- **Hono**: Fast web framework
- **Drizzle ORM**: TypeScript ORM
- **Neon**: Serverless Postgres (Production)
- **Neon HTTP Proxy**: Local development & testing simulation
- **Vitest**: Testing framework
- **Cloudflare Workers**: Deployment platform
- **Biome**: Formatter & Linter
- **Lefthook**: Git hooks manager

## Documentation

- [Architecture](./docs/architecture.md): Database connection strategy & App structure
- [Testing](./docs/testing.md): Testing strategy & Environment isolation

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | PWA installation guide page |
| `/share` | GET | PWA share_target (save URL) |
| `/manifest.json` | GET | PWA Manifest |

## Environment Variables

| File | Purpose | Git Tracked |
|------|---------|-------------|
| `.env.sample` | Template for environment variables | ✓ |
| `.env` | Development settings (copy from .env.sample) | ✗ |
| `.env.test` | Test environment settings (fixed values, shared) | ✓ |
| `.dev.vars` | Cloudflare Workers runtime variables (auto-generated) | ✗ |

**About `.env.test`**: Committed to the repository to ensure test environment consistency. Used by Vitest to connect to the dedicated test database.

## Prerequisites

- Node.js (v20 or later)
- Docker & Docker Compose (required for local database & neon-proxy)

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Copy the sample environment file and configure it if necessary.
   ```bash
   cp .env.sample .env
   ```

3. **Start Local Infrastructure**
   Start Postgres and Neon HTTP Proxy (for both dev and test environments).
   ```bash
   docker compose up -d
   ```

4. **Initialize Database & Runtime Variables**
   Run migrations and generate `.dev.vars` for Cloudflare Workers runtime.
   ```bash
   npm run db:migrate
   npm run hono:env
   ```

## Development

Start the development server:

```bash
npm run dev
```

> **Note:** The local environment uses a Dockerized Postgres with `neon-http-proxy` to simulate the production serverless environment.
> If you update `.env`, remember to run `npm run hono:env` to sync changes to `.dev.vars`.

## Testing

Run tests with Vitest. Tests run against a dedicated isolated database environment (via Docker).

```bash
npm test
```

## Quality Control

This project uses **Lefthook** to ensure code quality before commits.

- **Biome**: Formatter and Linter
- **Type Check**: TypeScript compiler check

These checks run automatically on `git commit`. You can also run them manually:

```bash
# Run Biome check
npx biome check .

# Run Type check
npm run type-check
```

## Database Commands

Common tasks for database management:

```bash
# Run migrations (Dev)
npm run db:migrate

# Run migrations (Test)
npm run db:migrate:test

# Open Drizzle Studio (GUI)
npm run db:studio

# Open Drizzle Studio for test DB
npm run db:studio:test

# Truncate tables (clear data, keep schema)
npm run db:truncate

# Reset database (Drop all tables)
npm run db:clean
```

## Deployment

```bash
npm run deploy
```

## Type Generation

Generate types based on your Worker configuration (wrangler.jsonc):

```bash
npm run cf-typegen
```

## License

This project is licensed under the [MIT License](./LICENSE).