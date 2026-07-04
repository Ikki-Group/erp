# Ikki ERP Server

Backend API server for Ikki ERP system built with **Bun + Elysia + Drizzle + Zod**.

Optimized for solo developer productivity with AI-assisted development.

---

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Setup environment
cp .env.example .env.development

# Run database migrations
bun run db:migrate

# Start dev server
bun run dev:server

# Run tests
bun test
```

---

## 🛠️ Tech Stack

| Layer             | Technology                                              |
| ----------------- | ------------------------------------------------------- |
| **Runtime**       | [Bun](https://bun.sh)                                   |
| **Framework**     | [Elysia](https://elysiajs.com)                          |
| **Database**      | PostgreSQL with [Drizzle ORM](https://orm.drizzle.team) |
| **Caching**       | [BentoCache](https://bentocache.dev)                    |
| **Validation**    | [Zod](https://zod.dev) v4                               |
| **Logging**       | [LogTape](https://logtape.org)                          |
| **Observability** | OpenTelemetry                                           |

---

## 📁 Project Structure

```
apps/server/
├── src/
│   ├── server.ts          # Entry point
│   ├── app.ts             # Elysia app
│   │
│   ├── config/            # Environment & constants
│   ├── db/                # Database schemas (Drizzle)
│   ├── infra/             # Infrastructure (DB, cache, logger)
│   ├── shared/            # Shared utilities
│   ├── types/             # Global types
│   │
│   ├── modules/           # Feature modules (vertical slices)
│   │   ├── _registry.ts   # DI container
│   │   ├── _routes.ts     # Route aggregator
│   │   ├── iam/           # IAM module (user, role, assignment)
│   │   ├── location/      # Location module
│   │   ├── auth/          # Authentication
│   │   └── ...            # Other modules
│   │
│   └── tests/             # Test setup & helpers
│
├── scripts/               # Utility scripts (seed, helpers, codegen)
└── drizzle/               # Generated migrations
```

**Read more:** [docs/architecture/MODULE_STANDARD.md](../../docs/architecture/MODULE_STANDARD.md) — the module source of truth. All architecture docs live centrally at the repo-root [`docs/`](../../docs/README.md).

---

## 📚 Essential Commands

### Development

```bash
bun run dev:server        # Start dev server (with --watch)
bun run dev:web           # Start Vite dev server
bun run build             # Production build
```

### Database

```bash
bun run db:generate       # Generate migration from schema
bun run db:migrate        # Apply migrations
bun run db:studio         # Open Drizzle Studio
bun run db:seed           # Seed database
```

### Code Quality

```bash
bun test                  # Run tests
bun run typecheck         # Type checking
bun run lint              # Lint code
bun run verify            # Full verification (lint + typecheck + test)
bun run check-deps        # Check circular dependencies
```

---

## 📖 Documentation

All docs are centralized at the repo root [`docs/`](../../docs/README.md).

### For Developers

1. **[MODULE_STANDARD.md](../../docs/architecture/MODULE_STANDARD.md)** - **Source of truth** for module structure
2. **[SERVER_ARCHITECTURE.md](../../docs/architecture/SERVER_ARCHITECTURE.md)** - Project structure, design philosophy, layer architecture
3. **[CODE_PATTERNS.md](../../docs/architecture/CODE_PATTERNS.md)** - Common patterns, best practices, examples
4. **[MODULE_CHECKLIST.md](../../docs/architecture/MODULE_CHECKLIST.md)** - Step-by-step module creation guide

### For AI Agents

The documentation is **AI-first**. When using Claude Code or similar tools:

- Start with `MODULE_STANDARD.md` (the source of truth)
- Reference `CODE_PATTERNS.md` for implementation patterns
- Use `MODULE_CHECKLIST.md` for step-by-step guidance
- Copy from the reference modules (`location/`, `iam/`) for new modules

**Project instructions:** See [/CLAUDE.md](../../CLAUDE.md) at repo root.

---

## 🏗️ Module Structure

Each module follows a **vertical slice architecture**:

```
modules/{module}/
├── {module}.module.ts    # Module factory (DI)
├── {module}.contract.ts  # Zod schemas (validation)
├── {module}.repo.ts      # Data access (Drizzle)
├── {module}.service.ts   # Business logic
├── {module}.route.ts     # HTTP routes (Elysia)
├── {module}.internal.ts  # Internal errors/types
└── index.ts              # Public API
```

**Complex modules** may have submodules:

```
modules/iam/
├── iam.module.ts         # Aggregate factory
├── iam.route.ts          # Aggregate routes
├── user/                 # User submodule
├── role/                 # Role submodule
├── assignment/           # Assignment submodule
└── composed/             # Cross-submodule queries
```

---

## 🎯 Code Style

### Key Principles

- **ES Modules only** (import/export, not CommonJS)
- **Serial integer IDs** (not UUIDs)
- **Zod for validation** (with spread-shape pattern, NOT `.extend()`)
- **Service pattern** (handleCreate, handleUpdate, etc.)
- **Repository pattern** (pure data access, return `null` for not found)
- **Audit trail** (all mutations include createdBy/updatedBy)
- **Cache invalidation** (on all writes)
- **Batch operations** (use `inArray()` + RelationMap, avoid N+1 queries)

### Naming Conventions

| Type      | Convention | Example                               |
| --------- | ---------- | ------------------------------------- |
| Functions | camelCase  | `handleCreate`, `findById`            |
| Classes   | PascalCase | `UserService`, `LocationRepo`         |
| Constants | UPPERCASE  | `MAX_RETRIES`, `DEFAULT_LIMIT`        |
| Files     | kebab-case | `user.service.ts`, `location.repo.ts` |

---

## 🧪 Testing

```bash
# Run all tests
bun test

# Run specific test file
bun test src/modules/location/location.test.ts

# Run with coverage
bun test --coverage
```

### Test Types

1. **Unit Tests** (`*.test.ts`) - Service logic with mocked repo
2. **Integration Tests** (`*.integration.test.ts`) - Full HTTP flow with real DB

---

## 🚦 Pre-Commit Checklist

Before committing:

- [ ] `bun run verify` passes (lint + typecheck + test)
- [ ] `bun run check-deps` passes (no circular dependencies)
- [ ] All mutations have audit stamps
- [ ] All mutations invalidate cache
- [ ] All unique fields have conflict checks
- [ ] No N+1 queries (use batch operations)

---

## 🌍 Environment Variables

Copy `.env.example` to `.env.development`:

```bash
cp .env.example .env.development
```

Required variables:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string (for cache)
- `JWT_SECRET` - Secret for JWT signing
- `PORT` - Server port (default: 3000)

---

## 🐛 Troubleshooting

### Database Issues

```bash
# Reset database (development only)
bun run db:push --force

# Check migration status
bun run db:migrate --check
```

### Cache Issues

```bash
# Clear all cache
redis-cli FLUSHALL
```

### Type Errors

```bash
# Regenerate Drizzle types
bun run db:generate
```

---

## 🤝 Contributing

1. Read [MODULE_STANDARD.md](../../docs/architecture/MODULE_STANDARD.md) — the source of truth
2. Follow patterns in [CODE_PATTERNS.md](../../docs/architecture/CODE_PATTERNS.md)
3. Use checklist in [MODULE_CHECKLIST.md](../../docs/architecture/MODULE_CHECKLIST.md)
4. Copy from the reference modules (`location/`, `iam/`)
5. Run `bun run verify` before committing

---

## 📄 License

Proprietary - Ikki ERP System

---

**Need help?** Check the docs/ directory or ask Claude Code! 🤖
