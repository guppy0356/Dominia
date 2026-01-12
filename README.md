# Dominia

A learning project for building CRUD applications with Hono + Drizzle ORM + Neon + Vitest.

## Tech Stack

- **Hono**: Fast web framework
- **Drizzle ORM**: TypeScript ORM
- **Neon**: Serverless Postgres
- **Vitest**: Testing framework
- **Cloudflare Workers**: Deployment platform

## Setup

```bash
npm install
```

## Development

Start the development server:

```bash
npm run dev
```

## Testing

```bash
# Watch mode
npm run test

# Run once
npm run test:run
```

## Deployment

```bash
npm run deploy
```

## Type Generation

Generate types based on your Worker configuration:

```bash
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiating `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```

## Roadmap

- Change responses to JSON format
- Set up test environment with seed data
