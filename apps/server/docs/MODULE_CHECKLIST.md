# Module Creation Checklist

**Version**: 1.0  
**Last Updated**: 2026-06-22

Step-by-step guide to create a new module or submodule.

---

## 📋 Pre-Implementation

### 1. Design Phase

- [ ] Define module name (lowercase, kebab-case)
- [ ] Identify entities (User, Role, Location, etc.)
- [ ] Determine module complexity:
  - [ ] **Simple** = Single entity, flat structure
  - [ ] **Complex** = Multiple entities, nested submodules
- [ ] Identify dependencies (which modules does this depend on?)
- [ ] Verify dependency layer (no circular dependencies)
- [ ] List unique fields (for conflict checking)
- [ ] List business rules

---

## 🗂️ File Structure Setup

### For Simple Module

```bash
mkdir -p src/modules/{module-name}
cd src/modules/{module-name}
touch {module-name}.module.ts
touch {module-name}.contract.ts
touch {module-name}.repo.ts
touch {module-name}.service.ts
touch {module-name}.route.ts
touch {module-name}.internal.ts
touch index.ts
```

**Checklist:**
- [ ] Create module directory
- [ ] Create `{module}.module.ts`
- [ ] Create `{module}.contract.ts`
- [ ] Create `{module}.repo.ts`
- [ ] Create `{module}.service.ts`
- [ ] Create `{module}.route.ts`
- [ ] Create `{module}.internal.ts` (for errors/types)
- [ ] Create `index.ts` (public exports)

---

### For Complex Module (with Submodules)

```bash
mkdir -p src/modules/{module-name}/{submodule-1}
mkdir -p src/modules/{module-name}/{submodule-2}
mkdir -p src/modules/{module-name}/composed
cd src/modules/{module-name}
touch {module-name}.module.ts
touch {module-name}.route.ts
touch index.ts
touch constants.ts

cd {submodule-1}
touch {submodule-1}.contract.ts
touch {submodule-1}.repo.ts
touch {submodule-1}.service.ts
```

**Checklist:**
- [ ] Create module directory
- [ ] Create `{module}.module.ts` (factory)
- [ ] Create `{module}.route.ts` (aggregate routes)
- [ ] Create `index.ts` (public exports)
- [ ] Create `constants.ts` (if needed)
- [ ] For each submodule:
  - [ ] Create submodule directory
  - [ ] Create `{sub}.contract.ts`
  - [ ] Create `{sub}.repo.ts`
  - [ ] Create `{sub}.service.ts`
- [ ] Create `composed/` (for cross-submodule queries)

---

## 📐 Database Schema

### Checklist

- [ ] Create or update schema file in `db/schema/`
- [ ] Define table with Drizzle
- [ ] Include audit fields (`createdAt`, `updatedAt`, `createdBy`, `updatedBy`)
- [ ] Define indexes for frequently queried columns
- [ ] Define foreign key constraints
- [ ] Generate migration: `bun run db:generate`
- [ ] Review migration SQL
- [ ] Apply migration: `bun run db:migrate`

### Example

```ts
// db/schema/location.ts
import { pgTable, serial, varchar, timestamp, integer } from 'drizzle-orm/pg-core'

export const locationsTable = pgTable('locations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  type: varchar('type', { length: 50 }).notNull(),
  
  // Audit fields
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: integer('created_by').notNull(),
  updatedBy: integer('updated_by').notNull(),
})
```

---

## 🔧 Implementation Steps

### Step 1: Contract (`*.contract.ts`)

- [ ] Import Zod and shared schemas (`zc`, `zp`)
- [ ] Define entity DTO (output from DB)
- [ ] Define mutation DTO (reusable for CREATE/UPDATE)
- [ ] Define create DTO (with all required fields)
- [ ] Define update DTO (with ID + optional fields)
- [ ] Define filter DTO (for list queries)
- [ ] Export all types

**Template:** See [MODULE_TEMPLATE.md](./MODULE_TEMPLATE.md#contract)

---

### Step 2: Repository (`*.repo.ts`)

- [ ] Create repo class with `db: DbContext` constructor param
- [ ] Implement `findById(id: number)`
- [ ] Implement `findByIds(ids: number[])`
- [ ] Implement `create(data: CreateDto)`
- [ ] Implement `update(id: number, data: Partial<Dto>)`
- [ ] Implement `delete(id: number)`
- [ ] Implement `findWithPagination(filter: FilterDto)` (if needed)
- [ ] Implement custom queries (if needed)
- [ ] **IMPORTANT:** Return `null` for not found (NOT throw)
- [ ] **IMPORTANT:** Use `inArray()` for batch queries
- [ ] **IMPORTANT:** Guard empty arrays

**Template:** See [MODULE_TEMPLATE.md](./MODULE_TEMPLATE.md#repository)

---

### Step 3: Service (`*.service.ts`)

- [ ] Create service class with repo + cache constructor params
- [ ] Initialize cache with namespace
- [ ] Define unique fields for conflict checking
- [ ] Implement `handleCreate(dto, actor)`
  - [ ] Check conflicts
  - [ ] Validate business rules
  - [ ] Create in DB (with `stampCreate`)
  - [ ] Invalidate cache
- [ ] Implement `handleUpdate(dto, actor)`
  - [ ] Check exists
  - [ ] Check conflicts (exclude current)
  - [ ] Validate business rules
  - [ ] Update in DB (with `stampUpdate`)
  - [ ] Invalidate cache
- [ ] Implement `handleGetById(id)`
  - [ ] Use cache
  - [ ] Throw NotFoundError if not found
- [ ] Implement `handleGetByIds(ids)` (for batch)
- [ ] Implement `handleList(filter)` (with pagination)
- [ ] Implement `handleDelete(id, actor)`
  - [ ] Check exists
  - [ ] Check dependencies
  - [ ] Delete from DB
  - [ ] Invalidate cache
- [ ] Add `@record` decorator to all public methods
- [ ] Implement `toRelationMap()` helper

**Template:** See [MODULE_TEMPLATE.md](./MODULE_TEMPLATE.md#service)

---

### Step 4: Internal (`*.internal.ts`)

- [ ] Define custom error helpers
- [ ] Define internal types (if needed)
- [ ] Define constants (if needed)

**Template:**
```ts
import { NotFoundError, ConflictError } from '@/shared/errors/http-error'

export const LocationError = {
  notFound: (id: number) =>
    new NotFoundError('Location not found', {
      code: 'LOCATION_NOT_FOUND',
      context: { id },
    }),
  
  nameExists: (name: string) =>
    new ConflictError('Location name already exists', {
      code: 'LOCATION_NAME_ALREADY_EXISTS',
      context: { name },
    }),
}
```

---

### Step 5: Module Factory (`*.module.ts`)

- [ ] Define `Deps` interface (if module has dependencies)
- [ ] Define module interface (public API)
- [ ] Create factory function `createXxxModule`
- [ ] Instantiate repos
- [ ] Instantiate services (inject dependencies)
- [ ] Return module object

**Template:** See [MODULE_TEMPLATE.md](./MODULE_TEMPLATE.md#module-factory)

---

### Step 6: Routes (`*.route.ts`)

- [ ] Create route group with module prefix
- [ ] Implement GET list route
- [ ] Implement GET detail route
- [ ] Implement POST create route
  - [ ] Validate body with Zod schema
  - [ ] Extract actor from context
- [ ] Implement PATCH update route
- [ ] Implement DELETE route
- [ ] Use inline async functions (not separate handlers)

**Template:** See [MODULE_TEMPLATE.md](./MODULE_TEMPLATE.md#routes)

---

### Step 7: Public API (`index.ts`)

- [ ] Export module type
- [ ] Export factory function
- [ ] Export DTOs (if needed by other modules)
- [ ] Do NOT export repo/service classes directly

**Template:**
```ts
export type { LocationModule } from './location.module'
export { createLocationModule } from './location.module'
export type { LocationDto, LocationCreateDto, LocationUpdateDto } from './location.contract'
```

---

## 🔗 Integration

### Step 8: Register in Module Registry

- [ ] Open `modules/_registry.ts`
- [ ] Import module type and factory
- [ ] Add to `Modules` interface
- [ ] Instantiate in `createModules` function
- [ ] Inject dependencies (if needed)
- [ ] Return in module object

**Example:**
```ts
// modules/_registry.ts
import { createLocationModule, type LocationModule } from '@/modules/location'

export interface Modules {
  location: LocationModule
  // ... other modules
}

export function createModules(db: DbContext, cacheClient: CacheClient): Modules {
  const location = createLocationModule(db, cacheClient)
  const iam = createIamModule(db, cacheClient, { location })  // Pass as dep
  
  return { location, iam }
}
```

---

### Step 9: Register Routes

- [ ] Open `modules/_routes.ts`
- [ ] Import route function
- [ ] Add to route composition

**Example:**
```ts
// modules/_routes.ts
import { locationRoutes } from '@/modules/location/location.route'

export function registerRoutes(app: Elysia, modules: Modules) {
  return app
    .use((app) => locationRoutes(app, modules))
    // ... other routes
}
```

---

## ✅ Testing

### Step 10: Write Tests

- [ ] Create `{module}.test.ts` (unit tests)
- [ ] Test `handleCreate` (success + conflict cases)
- [ ] Test `handleUpdate` (success + not found + conflict)
- [ ] Test `handleGetById` (success + not found)
- [ ] Test `handleList` (with filters + pagination)
- [ ] Test `handleDelete` (success + not found + has dependencies)
- [ ] Create `{module}.integration.test.ts` (integration tests)
- [ ] Test full HTTP flow (POST, GET, PATCH, DELETE)
- [ ] Run tests: `bun test`

---

### Step 11: Verification

- [ ] Run type check: `bun run typecheck`
- [ ] Run linter: `bun run lint`
- [ ] Check circular dependencies: `bun run check-deps`
- [ ] Run full verification: `bun run verify`
- [ ] Test in Drizzle Studio: `bun run db:studio`
- [ ] Test with HTTP client (Postman/Insomnia/curl)

---

## 📝 Documentation

### Step 12: Update Docs

- [ ] Add module to ARCHITECTURE.md (if new layer/pattern)
- [ ] Add examples to CODE_PATTERNS.md (if new pattern)
- [ ] Update CLAUDE.md (if new convention)
- [ ] Add inline comments for complex business rules

---

## 🚀 Deployment Checklist

### Step 13: Pre-Deploy

- [ ] All tests pass
- [ ] Type checking passes
- [ ] Linter passes
- [ ] No circular dependencies
- [ ] Migration reviewed and tested
- [ ] Cache invalidation verified
- [ ] Error handling verified
- [ ] Audit trail verified (all mutations have createdBy/updatedBy)

### Step 14: Deploy

- [ ] Merge to `main`
- [ ] Apply migrations on production DB
- [ ] Monitor logs for errors
- [ ] Verify API endpoints work

---

## 🎯 Common Pitfalls

### ❌ Things to Avoid

- [ ] Using `.extend()` on Zod schemas (use spread-shape)
- [ ] Throwing errors in repo (return `null` for not found)
- [ ] Forgetting cache invalidation on mutations
- [ ] Missing conflict checks on CREATE/UPDATE
- [ ] Missing audit stamps (`createdBy`, `updatedBy`)
- [ ] Using N+1 queries (use `inArray` + RelationMap)
- [ ] Creating circular dependencies between modules
- [ ] Forgetting to guard empty arrays in batch queries
- [ ] Using loops with DB calls (use batch operations)

---

## 🔄 Maintenance Checklist

### When Modifying Existing Module

- [ ] Read existing tests to understand expected behavior
- [ ] Update tests if changing logic
- [ ] Update DTOs if changing schema
- [ ] Generate new migration if schema changed
- [ ] Update cache keys if query changed
- [ ] Verify dependent modules still work
- [ ] Check for breaking changes in public API

---

## 📊 Quick Reference

| Phase | Files | Key Actions |
|-------|-------|-------------|
| **Design** | - | Define entities, dependencies, business rules |
| **Schema** | `db/schema/*.ts` | Create tables, run migration |
| **Contract** | `*.contract.ts` | Define Zod schemas, export types |
| **Repo** | `*.repo.ts` | Implement CRUD, return `null` for not found |
| **Service** | `*.service.ts` | Business logic, cache, conflict checks |
| **Factory** | `*.module.ts` | DI container, inject dependencies |
| **Routes** | `*.route.ts` | HTTP endpoints, validate input |
| **Integration** | `_registry.ts`, `_routes.ts` | Register module, register routes |
| **Testing** | `*.test.ts`, `*.integration.test.ts` | Unit + integration tests |
| **Verification** | - | Type check, lint, check deps |

---

## 💡 Tips for AI Agents

When implementing a new module:

1. **Start with schema** - Get the DB structure right first
2. **Use templates** - Copy from [MODULE_TEMPLATE.md](./MODULE_TEMPLATE.md)
3. **Reference similar modules** - `iam/user/` and `location/` are good examples
4. **Check dependencies** - No circular imports
5. **Test as you go** - Don't wait until the end
6. **Cache everything** - Reads are cheap, writes invalidate
7. **Batch everything** - Use `inArray()` and `RelationMap`
8. **Stamp everything** - All mutations need audit fields

---

**Next:** [MODULE_TEMPLATE.md](./MODULE_TEMPLATE.md) for copy-paste ready code templates.
