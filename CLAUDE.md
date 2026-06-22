# CLAUDE.md - Ikki ERP

Ikki ERP is a TypeScript + Bun monorepo optimized for **solo developer productivity with AI-assisted development**.

**Tech Stack:** Bun, TypeScript, Elysia, Drizzle ORM, Zod v4, BentoCache, PostgreSQL (Neon)

---

## 🎯 Project Philosophy

1. **AI-First Development** - Documentation is written for Claude Code comprehension
2. **Solo Developer Optimized** - Minimal ceremony, flat when possible, scalable when needed
3. **Type Safety Everywhere** - TypeScript + Zod validation at boundaries
4. **Vertical Slicing** - Modules are self-contained feature slices
5. **Explicit Over Magic** - Predictable patterns, no hidden globals

---

## 🚀 Quick Commands

### Development
```bash
# Core
bun run dev:server      # Start dev server (apps/server)
bun run dev:web         # Start Vite dev server (apps/web)
bun run build           # Production build
bun run verify          # Lint + typecheck + tests

# Database (run from apps/server)
cd apps/server
bun run db:generate     # Generate migration from schema changes
bun run db:migrate      # Apply pending migrations
bun run db:studio       # Open Drizzle Studio (DB GUI)
bun run db:seed         # Seed database with sample data

# Testing
bun test                # Run all tests
bun test --coverage     # Run with coverage report
bun run check-deps      # Check circular dependencies
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
│   │   └── docs/             # **START HERE FOR AI AGENTS**
│   │       ├── ARCHITECTURE.md    # System design & structure
│   │       ├── CODE_PATTERNS.md   # Implementation patterns
│   │       ├── MODULE_CHECKLIST.md # Step-by-step guide
│   │       └── MODULE_TEMPLATE.md  # Copy-paste templates
│   │
│   └── web/            # Frontend (React + Vite)
│
├── docs/               # Product documentation
└── CLAUDE.md           # This file (project overview)
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

| Aspect | Rule | Why |
|--------|------|-----|
| **IDs** | Serial integers (not UUIDs) | Simpler, faster, human-readable |
| **Validation** | Zod with spread-shape (NOT `.extend()`) | `.extend()` breaks type inference |
| **Services** | Public: `handleX`, Private: no prefix | Clear API boundary |
| **Repos** | Return `null` for not found (NOT throw) | Let service decide error handling |
| **Audit** | All mutations: `createdBy`/`updatedBy` | Legal compliance + debugging |
| **Cache** | Invalidate on ALL writes | Prevent stale data |
| **Batch** | Use `inArray()` + RelationMap | Prevent N+1 queries |
| **Errors** | Custom errors (NotFoundError, etc.) | Structured error responses |

### Naming Conventions
```typescript
// Functions
handleCreate()         // Public service method
validateBusinessRule() // Private helper (no prefix)
findById()             // Repo method

// Classes
UserService            // PascalCase
LocationRepo           // PascalCase

// Constants
MAX_RETRIES            // UPPERCASE
DEFAULT_LIMIT          // UPPERCASE

// Files
user.service.ts        // kebab-case
location.repo.ts       // kebab-case
```

### Zod Pattern (Spread-Shape)
```typescript
// ❌ BAD: .extend() breaks type inference
const UserUpdateDto = UserCreateDto.extend({ id: z.number() })

// ✅ GOOD: Use spread-shape
const UserUpdateDto = z.object({
  ...zc.RecordId.shape,      // { id: number }
  ...UserMutationDto.shape,  // Reusable mutation fields
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
  await repo.findById(id)  // N+1 query!
}
```

### Relationship Pattern (RelationMap)
```typescript
// Prevent N+1 queries with in-memory JOIN
const users = await userRepo.findAll()
const locationIds = users.map(u => u.defaultLocationId).filter(Boolean)
const locations = await locationRepo.findByIds(locationIds)
const locationMap = RelationMap.fromArray(locations, v => v.id)

const result = users.map(user => ({
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

await checkConflict(repo.db, uniqueFields, dto)        // Create
await checkConflict(repo.db, uniqueFields, dto, id)    // Update (exclude self)
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

### When Building Features
1. **[apps/server/docs/ARCHITECTURE.md](apps/server/docs/ARCHITECTURE.md)** - Understand the system design first
2. **[apps/server/docs/CODE_PATTERNS.md](apps/server/docs/CODE_PATTERNS.md)** - Reference implementation patterns
3. **[apps/server/docs/MODULE_CHECKLIST.md](apps/server/docs/MODULE_CHECKLIST.md)** - Follow step-by-step guide
4. **[apps/server/docs/MODULE_TEMPLATE.md](apps/server/docs/MODULE_TEMPLATE.md)** - Copy templates for new modules

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
- [ ] Repos return `null` for not found (NOT throw)

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

| Issue | Symptom | Solution |
|-------|---------|----------|
| `.extend()` on Zod | Type errors, weird inference | Use spread-shape (`.shape`) |
| N+1 queries | Slow performance, many DB calls | Use `inArray()` + `RelationMap` |
| Missing audit | Can't track who changed what | Add `stampCreate`/`stampUpdate` |
| No cache invalidation | Stale data after updates | Call `cache.delete()` after writes |
| Empty array to `inArray()` | SQL error | Guard: `if (ids.length === 0) return []` |
| Circular dependencies | Import errors | Follow layer hierarchy, use `composed/` |
| Repo throws errors | Inconsistent error handling | Repo returns `null`, service throws |

---

## 🤖 AI Agent Guidance

### When Asked to Build a Feature
1. Read `apps/server/docs/ARCHITECTURE.md` to understand structure
2. Check existing similar modules (`iam/user/`, `location/`) for patterns
3. Copy templates from `apps/server/docs/MODULE_TEMPLATE.md`
4. Follow checklist in `apps/server/docs/MODULE_CHECKLIST.md`
5. Reference patterns in `apps/server/docs/CODE_PATTERNS.md`
6. Run `bun run verify` before completion

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

| Module | Layer | Dependencies | Example |
|--------|-------|--------------|---------|
| `auth`, `session` | Layer 0 (Core) | None | Authentication primitives |
| `iam`, `location`, `material` | Layer 1 (Master) | Layer 0 | User management, locations |
| `sales`, `purchasing` | Layer 2 (Operations) | Layer 0, 1 | Business operations |
| `dashboard`, `reporting` | Layer 3 (Aggregators) | Layer 0, 1, 2 | Cross-module analytics |

**Rule:** Import flows DOWN the layers (Layer 3 → 2 → 1 → 0), never UP.

---

## 📊 Quick Reference

### File Types
| File | Purpose | Key Rules |
|------|---------|-----------|
| `*.contract.ts` | Zod schemas + types | Use spread-shape, export types |
| `*.repo.ts` | Data access | Return `null` for not found, use `inArray()` |
| `*.service.ts` | Business logic | Public: `handleX`, throw custom errors |
| `*.route.ts` | HTTP endpoints | Thin wrappers, validate with Zod |
| `*.module.ts` | DI container | Factory function, inject deps |
| `*.internal.ts` | Internal errors/types | Custom error helpers |

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
await this.cache.deleteAll()  // Invalidate list caches
```

### Batch Everything (Queries)
```typescript
// ✅ GOOD: Single query
const users = await this.repo.findByIds([1, 2, 3])

// ❌ BAD: N queries
const users = await Promise.all([1, 2, 3].map(id => this.repo.findById(id)))
```

---

## 📞 Getting Help

1. **For architecture questions:** Read `apps/server/docs/ARCHITECTURE.md`
2. **For implementation patterns:** Read `apps/server/docs/CODE_PATTERNS.md`
3. **For step-by-step guide:** Read `apps/server/docs/MODULE_CHECKLIST.md`
4. **For templates:** Read `apps/server/docs/MODULE_TEMPLATE.md`
5. **For examples:** Check `iam/user/` or `location/` modules

---

**Last Updated:** 2026-06-22  
**Maintained by:** Solo developer + Claude Code  
**License:** Proprietary - Ikki ERP System
