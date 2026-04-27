# Server Development Skill

**Description**: Agentic coding assistance for apps/server (Bun + Elysia + Drizzle + PostgreSQL). Helps implement modules following Golden Path 2.0 standards.

**When to trigger**:
- Creating new modules (entities, services, routes)
- Implementing CRUD operations
- Writing tests for modules
- Refactoring to match standards
- Adding cross-module dependencies

**Context**: Workspace path: `/Users/rizqynugroho9/workspace/ikki/erp/apps/server`

---

## Standards Summary

### Module Structure (Co-located)
```
src/modules/{name}/
├── dto/{entity}.dto.ts
├── {entity}.repo.ts
├── {entity}.service.ts
├── {entity}.route.ts
├── {entity}.service.test.ts
├── {entity}.route.test.ts
├── constants.ts
├── errors.ts
└── index.ts (Module class + Services interface only)
```

### Key Patterns
- **DI**: `private readonly repo` constructor injection
- **Service methods**: `get*()` for services, `handle*()` for router
- **Cache**: Use `CACHE_KEY_DEFAULT` from `@/core/cache`
- **Testing**: Co-located tests, skip DTO tests, inject fake repo
- **No usecase layer**: Orchestration in service with lazy getters
- **Barrel policy**: NO `export *` from root `index.ts`

### Dependencies
- Layer 0: location, product (no deps)
- Layer 1: iam, material, supplier, employee, finance (depends on location)
- Layer 1.5: auth (depends on iam)
- Layer 2: inventory, recipe, sales, purchasing (depends on Layer 0-1)
- Layer 3: dashboard, moka, tool (depends on all)

---

## Implementation Guide

### 1. Creating New Module

1. Create folder: `src/modules/{name}/`
2. Create files: dto, repo, service, route, tests, constants, errors, index.ts
3. Follow templates from [CODE_PATTERNS.md](../../docs/technical/CODE_PATTERNS.md)
4. Register in `_registry.ts` and `_routes.ts`

### 2. Service Implementation

```typescript
export class EntityService {
  constructor(private readonly repo = new EntityRepo()) {}

  // READ - cache-backed
  async getById(id: number): Promise<dto.EntityDto | undefined> {
    return record('EntityService.getById', async () => {
      return cache.getOrSet({
        key: CACHE_KEY_DEFAULT.byId(id),
        factory: async ({ skip }) => (await this.repo.getById(id)) ?? skip(),
      })
    })
  }

  // HANDLER - router only
  async handleDetail(id: number): Promise<dto.EntityDto> {
    return record('EntityService.handleDetail', async () => {
      const result = await this.getById(id)
      if (!result) throw EntityErrors.notFound(id)
      return result
    })
  }

  private async clearCache(id?: number): Promise<void> {
    const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
    if (id) keys.push(CACHE_KEY_DEFAULT.byId(id))
    await cache.deleteMany({ keys })
  }
}
```

### 3. Testing

```typescript
// Service test
function createFakeRepo(overrides = {}): EntityRepo {
  return { getById: async () => undefined, ...overrides } as EntityRepo
}

beforeEach(() => {
  service = new EntityService(createFakeRepo())
})

// Route test
function createTestApp(service: EntityService) {
  return new Elysia().use(errorHandler).use(createMockAuthPlugin()).use(initEntityRoute(service))
}
```

### 4. Cross-Module Dependencies

```typescript
// Lazy getter to avoid circular bootstrap
constructor(
  private readonly repo = new EntityRepo(),
  private readonly getOtherService?: () => OtherService,
) {}

// Usage
const otherService = this.getOtherService!()
```

---

## Anti-Patterns to Avoid

❌ Router calls `get*()` directly → use `handle*()`
❌ `repo` is public → use `private readonly`
❌ `clearCache()` is public → use `private`
❌ Root `index.ts` has `export *` → only export Module class
❌ Usecase layer for simple CRUD → router → service direct
❌ Custom cache keys → use `CACHE_KEY_DEFAULT`
❌ DTO tests → skip (validated via routes)

---

## References

- [SERVER_STANDARDS.md](../../docs/technical/SERVER_STANDARDS.md) — Complete standards
- [CODE_PATTERNS.md](../../docs/technical/CODE_PATTERNS.md) — Code templates
- [MODULE_CHECKLIST.md](../../docs/technical/MODULE_CHECKLIST.md) — Review checklist
- [ARCHITECTURE.md](../../docs/technical/ARCHITECTURE.md) — Architecture overview

---

## Commands

- `bun run dev:server` — Start dev server
- `bun run typecheck` — Type check
- `bun test` — Run tests
- `bun run verify` — Full verification (lint + typecheck + knip + check-deps)
