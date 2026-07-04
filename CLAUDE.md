# CLAUDE.md - Ikki ERP

Ikki ERP is a TypeScript + Bun monorepo optimized for **solo developer productivity with AI-assisted development**.

**Tech Stack:** Bun, TypeScript, Elysia, Drizzle ORM, Zod v4, BentoCache, PostgreSQL (Neon)

> **📌 See [AGENTS.md](AGENTS.md) first for commands & toolchain.**
> `AGENTS.md` is the source of truth for the monorepo layout, exact commands
> (which are **per-app**, not root — see note there), toolchain quirks
> (oxlint/oxfmt, path aliases), codegen, and deploy/CI. `CLAUDE.md` (this file)
> covers the deeper server architecture & code patterns. If a command in this
> file disagrees with `AGENTS.md`, trust `AGENTS.md`.

---

## 🎯 Project Philosophy

1. **AI-First Development** - Documentation is written for Claude Code comprehension
2. **Solo Developer Optimized** - Minimal ceremony, flat when possible, scalable when needed
3. **Type Safety Everywhere** - TypeScript + Zod validation at boundaries
4. **Vertical Slicing** - Modules are self-contained feature slices
5. **Explicit Over Magic** - Predictable patterns, no hidden globals

---

## 🚀 Quick Commands

> Full & authoritative command reference is in **[AGENTS.md](AGENTS.md)**.
> Key thing to remember: most commands (`verify`, `typecheck`, `test`, `db:*`)
> are **per-app**, run them from `apps/server` (or via `bun --filter @ikki/server <script>`),
> NOT from the repo root.

### Development

```bash
# Root
bun run dev:server      # Start dev server (apps/server)
bun run dev:web         # Start Vite dev server (apps/web)
bun run lint            # oxlint across repo
bun run format          # oxfmt

# Server (run from apps/server)
cd apps/server
bun run verify          # lint + typecheck + knip + check-deps (the real gate)
bun run typecheck       # tsc --noEmit
bun run test            # NODE_ENV=test bun test --bail
bun run check-deps      # Circular dependency check (dpdm)

# Database (run from apps/server)
bun run db:generate     # Generate migration from schema changes
bun run db:migrate      # Apply pending migrations
bun run db:studio       # Open Drizzle Studio (DB GUI)
bun run db:seed         # Seed database with sample data
```

---

## 📐 Architecture Overview

### Project Structure

```
ikki/erp/
├── apps/
│   ├── server/         # Backend API (Elysia + Drizzle)
│   │   ├── src/
│   │   │   ├── modules/      # Feature modules (vertical slices)
│   │   │   ├── infra/        # Infrastructure (DB, cache, logger)
│   │   │   ├── shared/       # Shared utilities
│   │   │   └── db/           # Database schemas
│   │   └── README.md         # Server quick-start
│   │
│   └── web/            # Frontend (React + Vite)
│
├── docs/               # **CENTRAL DOCS** — architecture, codegen, database, product
│   └── database/       # DB schema docs (ERDs, conventions) — see below
├── AGENTS.md           # **Commands, toolchain, codegen, deploy (read first)**
└── CLAUDE.md           # This file (architecture & code patterns)
```

### Module Anatomy (Vertical Slice)

```
modules/{module}/
├── {module}.module.ts    # Factory (DI container)
├── {module}.contract.ts  # Zod schemas (validation)
├── {module}.repo.ts      # Data access (Drizzle)
├── {module}.service.ts   # Business logic
├── {module}.route.ts     # HTTP routes (Elysia)
├── {module}.internal.ts  # Internal errors/types
└── index.ts              # Public API exports
```

**Complex modules** (e.g., `iam/`) have submodules:

```
modules/iam/
├── iam.module.ts     # Aggregate factory
├── iam.route.ts      # Aggregate routes
├── user/             # User submodule
├── role/             # Role submodule
└── composed/         # Cross-submodule queries
```

---

## 💡 Code Style & Patterns

### Core Principles

| Aspect         | Rule                                    | Why                               |
| -------------- | --------------------------------------- | --------------------------------- |
| **IDs** | Serial integers (not UUIDs) | Simpler, faster, human-readable |
| **Validation** | Zod with spread-shape (NOT `.extend()`) | `.extend()` breaks type inference |
| **Services** | Public: `handleX`, Private: no prefix | Clear API boundary |
| **Repos** | Declare an `I{Module}Repo` port; service depends on the port | Testable with typed fakes, decoupled |
| **Repos** | Return `undefined` for not found (NOT `null`, NOT throw) | Consistent; service decides error handling |
| **Conflict** | `checkConflict({ db: this.repo.db, … })` (explicit db, no global) | Tx-correct; no hidden singleton |
| **Atomicity** | Multi-write ops use `withTransaction(this.repo.db, tx => …)` | All-or-nothing |
| **Audit** | All mutations: `createdBy`/`updatedBy` | Legal compliance + debugging |
| **Cache** | Invalidate on ALL writes | Prevent stale data |
| **Batch** | Use `inArray()` + RelationMap | Prevent N+1 queries |
| **Errors** | Custom errors (NotFoundError, etc.) | Structured error responses |

### Naming Conventions

```typescript
// Functions
handleCreate() // Public service method
validateBusinessRule() // Private helper (no prefix)
findById() // Repo method

// Classes
UserService // PascalCase
LocationRepo // PascalCase

// Constants
MAX_RETRIES // UPPERCASE
DEFAULT_LIMIT // UPPERCASE

// Files
user.service.ts // kebab-case
location.repo.ts // kebab-case
```

### Zod Pattern (Spread-Shape)

```typescript
// ❌ BAD: .extend() breaks type inference
const UserUpdateDto = UserCreateDto.extend({ id: z.number() })

// ✅ GOOD: Use spread-shape
const UserUpdateDto = z.object({
	...zc.RecordId.shape, // { id: number }
	...UserMutationDto.shape, // Reusable mutation fields
})
```

---

## 🗄️ Database Patterns

### Query Patterns

```typescript
// ✅ GOOD: Batch with inArray()
const users = await repo.findByIds([1, 2, 3])

// ❌ BAD: Loop with N queries
for (const id of [1, 2, 3]) {
	await repo.findById(id) // N+1 query!
}
```

### Relationship Pattern (RelationMap)

```typescript
// Prevent N+1 queries with in-memory JOIN
const users = await userRepo.findAll()
const locationIds = users.map((u) => u.defaultLocationId).filter(Boolean)
const locations = await locationRepo.findByIds(locationIds)
const locationMap = RelationMap.fromArray(locations, (v) => v.id)

const result = users.map((user) => ({
	...user,
	location: user.defaultLocationId ? locationMap.get(user.defaultLocationId) : null,
}))
```

### Conflict Checking

```typescript
// Before CREATE/UPDATE, check unique constraints
const uniqueFields: ConflictField<{ email: string }>[] = [
	{
		field: 'email',
		column: usersTable.email,
		message: 'Email already exists',
		code: 'USER_EMAIL_ALREADY_EXISTS',
	},
]

await checkConflict(repo.db, uniqueFields, dto) // Create
await checkConflict(repo.db, uniqueFields, dto, id) // Update (exclude self)
```

---

## 🧪 Testing Strategy

### Test Types

1. **Unit Tests** (`*.test.ts`) - Service logic with mocked repo
2. **Integration Tests** (`*.integration.test.ts`) - Full HTTP flow + real DB

### Running Tests

```bash
bun test                          # All tests
bun test location.test.ts         # Specific file
bun test --coverage               # With coverage
```

---

## 📚 Documentation (AI Agent Priority Order)

### Before Anything

- **[AGENTS.md](AGENTS.md)** - Commands (per-app), toolchain (oxlint/oxfmt), codegen, deploy/CI

### When Building Features

1. **[docs/architecture/MODULE_STANDARD.md](docs/architecture/MODULE_STANDARD.md)** - **START HERE.** Single source of truth for module structure (repo ports, undefined not-found, explicit-db checkConflict, withTransaction, unit-first tests). References: `location/` (simple), `iam/` (complex).
2. **[docs/architecture/SERVER_ARCHITECTURE.md](docs/architecture/SERVER_ARCHITECTURE.md)** - Understand the broader system design
3. **[docs/architecture/CODE_PATTERNS.md](docs/architecture/CODE_PATTERNS.md)** - Reference implementation patterns
4. **[docs/architecture/MODULE_CHECKLIST.md](docs/architecture/MODULE_CHECKLIST.md)** - Follow step-by-step guide

### When Touching the Database

- **[docs/database/README.md](docs/database/README.md)** - Index: domain map, ERDs, schema conventions
- **[docs/database/SCHEMA_CONVENTIONS.md](docs/database/SCHEMA_CONVENTIONS.md)** - Rules for writing/reviewing schema (naming, constraints, indexing, caching)

### When Reviewing Code

- Check against patterns in `CODE_PATTERNS.md`
- Verify checklist in `MODULE_CHECKLIST.md`
- Ensure consistency with existing modules (`iam/`, `location/`)

### When Fixing Bugs

- Check service logic (business rules, cache invalidation)
- Check repo queries (N+1, empty array guards)
- Check error handling (custom errors, proper codes)

---

## 🚦 Pre-Commit Checklist

**ALWAYS run before committing:**

```bash
bun run verify          # Lint + typecheck + tests
bun run check-deps      # No circular dependencies
```

**Code Quality Checks:**

- [ ] All tests pass (`bun test`)
- [ ] Type checking passes (`bun run typecheck`)
- [ ] Linter passes (`bun run lint`)
- [ ] No circular dependencies (`bun run check-deps`)
- [ ] All mutations have audit stamps (`createdBy`, `updatedBy`)
- [ ] All mutations invalidate cache
- [ ] All unique fields have conflict checks
- [ ] No N+1 queries (use batch operations)
- [ ] Services use `handleX` for public methods
- [ ] Repos declare an `I{Module}Repo` port; service depends on it
- [ ] Repos return `undefined` for not found (NOT `null`, NOT throw)
- [ ] `checkConflict` receives explicit `db: this.repo.db`
- [ ] Multi-write operations wrapped in `withTransaction`

---

## 🔗 Module Dependencies

Modules follow a **strict layered hierarchy** to prevent circular dependencies:

```
Layer 3: Aggregators (Dashboard, Reporting)
    ↓ depends on
Layer 2: Operations (Sales, Purchasing, Production)
    ↓ depends on
Layer 1: Master Data (IAM, Location, Material, Product)
    ↓ depends on
Layer 0: Core (Auth, Session)
```

**Rules:**

- Lower layers CANNOT import from upper layers
- Same-layer modules CAN import each other (but avoid cycles)
- Use `composed/` submodules for cross-cutting queries

**Verify:** `bun run check-deps`

---

## ⚠️ Common Gotchas

| Issue                      | Symptom                         | Solution                                 |
| -------------------------- | ------------------------------- | ---------------------------------------- |
| `.extend()` on Zod         | Type errors, weird inference    | Use spread-shape (`.shape`)              |
| N+1 queries                | Slow performance, many DB calls | Use `inArray()` + `RelationMap`          |
| Missing audit              | Can't track who changed what    | Add `stampCreate`/`stampUpdate`          |
| No cache invalidation      | Stale data after updates        | Call `cache.delete()` after writes       |
| Empty array to `inArray()` | SQL error                       | Guard: `if (ids.length === 0) return []` |
| Circular dependencies      | Import errors                   | Follow layer hierarchy, use `composed/`  |
| Repo throws errors         | Inconsistent error handling     | Repo returns `undefined`, service throws |

---

## 🤖 AI Agent Guidance

### When Asked to Build a Feature

1. Read `docs/architecture/MODULE_STANDARD.md` — the source of truth
2. Check existing similar modules (`iam/user/`, `location/`) for patterns
3. Follow the checklist in `docs/architecture/MODULE_CHECKLIST.md`
4. Reference patterns in `docs/architecture/CODE_PATTERNS.md`
5. Run `bun run verify` before completion

### When Asked to Review Code

1. Check against `CODE_PATTERNS.md` patterns
2. Verify all items in `MODULE_CHECKLIST.md` are done
3. Ensure consistency with existing modules
4. Run `bun run verify` and `bun run check-deps`

### When Asked to Fix a Bug

1. Identify layer (infra, shared, module)
2. Check service logic (business rules, cache)
3. Check repo queries (N+1, guards)
4. Add test case to prevent regression
5. Run `bun test` to verify fix

### Skills Available

- `/explore` - Search codebase for patterns
- `feature-development` - Build new features
- `code-review` - Review code quality
- `architecture-explorer` - Understand architecture
- `verify` - Run app and verify changes

---

## 🎯 Layer Dependencies Reference

| Module                        | Layer                 | Dependencies  | Example                    |
| ----------------------------- | --------------------- | ------------- | -------------------------- |
| `auth`, `session`             | Layer 0 (Core)        | None          | Authentication primitives  |
| `iam`, `location`, `material` | Layer 1 (Master)      | Layer 0       | User management, locations |
| `sales`, `purchasing`         | Layer 2 (Operations)  | Layer 0, 1    | Business operations        |
| `dashboard`, `reporting`      | Layer 3 (Aggregators) | Layer 0, 1, 2 | Cross-module analytics     |

**Rule:** Import flows DOWN the layers (Layer 3 → 2 → 1 → 0), never UP.

---

## 📊 Quick Reference

### File Types

| File            | Purpose               | Key Rules                                    |
| --------------- | --------------------- | -------------------------------------------- |
| `*.contract.ts` | Zod schemas + types   | Use spread-shape, export types               |
| `*.repo.ts`     | Data access           | Declare `I{Module}Repo` port; return `undefined` for not found; use `inArray()` |
| `*.service.ts`  | Business logic        | Public: `handleX`, throw custom errors       |
| `*.route.ts`    | HTTP endpoints        | Thin wrappers, validate with Zod             |
| `*.module.ts`   | DI container          | Factory function, inject deps                |
| `*.internal.ts` | Internal errors/types | Custom error helpers                         |

### Import Aliases

```typescript
import { DbContext } from '@/infra/database'
import { CacheService } from '@/infra/cache'
import { NotFoundError } from '@/shared/errors/http-error'
import { stampCreate } from '@/shared/audit/stamp'
import { usersTable } from '@/db/schema'
import { UserService } from '@/modules/iam'
```

---

## 🔥 Performance Patterns

### Cache Everything (Reads)

```typescript
// Get with cache
const user = await this.cache.getOrSet(id, async () => {
	return await this.repo.findById(id)
})

// Invalidate on write
await this.repo.update(id, data)
await this.cache.delete(id)
await this.cache.deleteAll() // Invalidate list caches
```

### Batch Everything (Queries)

```typescript
// ✅ GOOD: Single query
const users = await this.repo.findByIds([1, 2, 3])

// ❌ BAD: N queries
const users = await Promise.all([1, 2, 3].map((id) => this.repo.findById(id)))
```

---

## 📞 Getting Help

1. **For commands / toolchain / deploy:** Read `AGENTS.md`
2. **For module rules (source of truth):** Read `docs/architecture/MODULE_STANDARD.md`
3. **For architecture questions:** Read `docs/architecture/SERVER_ARCHITECTURE.md`
4. **For implementation patterns:** Read `docs/architecture/CODE_PATTERNS.md`
5. **For step-by-step guide:** Read `docs/architecture/MODULE_CHECKLIST.md`
6. **For web codegen:** Read `docs/codegen/WEB_CODEGEN.md`
7. **For database schema/ERDs:** Read `docs/database/README.md`
8. **For examples:** Check `iam/user/` or `location/` modules

---

**Last Updated:** 2026-06-22  
**Maintained by:** Solo developer + Claude Code  
**License:** Proprietary - Ikki ERP System
