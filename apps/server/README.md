# Ikki ERP Server

Backend API server for Ikki ERP system.

## Tech Stack

- **Runtime**: Bun
- **Framework**: Elysia
- **Database**: PostgreSQL with Drizzle ORM
- **Caching**: BentoCache
- **Logging**: LogTape with OpenTelemetry
- **Validation**: Zod

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run --watch src/server.ts

# Build
bun run build

# Type check
bun run typecheck

# Run tests
bun test
```

## Environment Variables

See `.env.example` for required environment variables.

## Project Structure

- `src/core/` - Core infrastructure (database, http, cache, logger, otel)
- `src/lib/` - Shared utilities (utils, auth, validation)
- `src/modules/` - Feature-based modules
- `src/config/` - Configuration
- `src/db/` - Database schema
- `src/tests/` - Tests

## Documentation

See `/docs/technical` for technical documentation.