---
inclusion: fileMatch
fileMatchPattern: "apps/server/**"
---

# Server Development

Operational guide for building and modifying features in `apps/server`. This steering provides rules, patterns, and references that Kiro must follow when working on server code.

## Canonical References

Read these docs before building or modifying server modules:

- #[[file:docs/server/02-module-standard.md]] — Module structure (single source of truth)
- #[[file:docs/server/03-code-standard.md]] — Naming, imports, TypeScript style, HTTP conventions
- #[[file:docs/server/04-code-patterns.md]] — Copy-ready code snippets
- #[[file:docs/server/01-server-architecture.md]] — System context, layers, startup
- #[[file:apps/server/src/infra/README.md]] — Database, cache, otel, logger utilities
- #[[file:apps/server/src/shared/README.md]] — Zod primitives, errors, http helpers, audit, utils

---

## Quick Rules (non-negotiable)

### Module Structure

Every module follows the vertical slice pattern:

```
modules/{module}/
├── {module}.schema.ts      # Zod schemas + inferred types
├── {module}.repo.ts        # I{Module}Repo port + concrete class
├── {module}.service.ts     # Business logic
├── {module}.route.ts       # Thin Elysia routes
├── {module}.internal.ts    # Error factory
├── {module}.module.ts      # Factory: create{Module}Module(db, cache, deps)
└── index.ts                # Public exports
```

Complex modules split entities into folders (`user/`, `role/`, …) with the same file set, plus a `composed/` submodule for cross-entity reads.

### Naming

| Element | Convention | Example |
|---------|-----------|---------|
| Zod schemas | `{Entity}Schema` / `{Entity}CreateSchema` / `{Entity}UpdateSchema` / `{Entity}FilterSchema` | `LocationSchema`, `UserCreateSchema` |
| Module factory | `create{Module}Module` | `createIamModule` |
| Route factory | `create{Module}Route` | `createIamRoute` |
| Repo port | `I{Module}Repo` | `ILocationRepo` |
| Error factory | `{Module}Error` object | `LocationError.notFound(id)` |
| DB schema file | `db/schema/{domain}.ts` | `db/schema/iam.ts` |
| Enums (Zod) | `{Name}Enum` | `LocationTypeEnum` |

### Zod Schema Rules

- Use **spread-shape**, never `.extend()`:
  ```ts
  export const XUpdateSchema = z.object({ id: zp.id, ...XMutationSchema.shape })
  ```
- Entity schemas include audit: `...zc.AuditBasic.shape`
- Extract private `MutationSchema` for shared create/update fields (never exported)
- Export both schema and type: `export type XSchema = z.infer<typeof XSchema>`
- Primitives: `zp.*` for output, `zc.*` for input, `zq.*` for query params (coerced)

### Repository Rules

- Declare `I{Module}Repo` interface; class implements it
- Expose `readonly db: DbContext`
- Not-found reads return `T | undefined` — never `null`, never throw
- Writes return `EntityRef | undefined`
- Every write method accepts `db?: DbContext = this.db` for transaction threading
- Verb names: reads = `findMany / findById / findByIds / findPage`; writes = `insert / insertMany / update / remove`
- Use `paginateWindow` (single-roundtrip) for pagination by default
- Use `#buildWhere(filter)` private method for composing WHERE clauses

### Service Rules

- Constructor: `(repo, cacheClient)` or `(deps, repo, cacheClient)` for cross-module deps
- Depend on the **port** (interface), not the concrete repo class
- `handleX` methods are the ONLY methods routes call
- Internal reuse uses plain verbs (`create`, `getById`, `update`)
- Telemetry: `record(...)` at ONE level only
- Every mutation stamps the actor: `{ ...data, ...stampCreate(actorId) }` / `stampUpdate(actorId)`
- Every mutation invalidates cache: use `this.cache.invalidateStandard(id?)` or custom `deleteFromKeys`
- Multi-write operations: `withTransaction(this.repo.db, async (tx) => { ... })`
- Conflict check: `checkConflict({ db: this.repo.db, ... })` — always pass `this.repo.db`
- Cross-module deps injected as narrow interfaces (typed picks), not whole modules

### Route Rules

- Thin: validate (Zod DTO in config) → call one `handleX` → wrap in `res.*`
- Actor via `auth.userId`
- Every route declares `response:` for contract generation
- Single delete via query: `zq.recordId`; bulk delete via body: `{ ids }`
- Auth macro: `auth: true` in route config

### Error Handling

- Never `try/catch` for expected business failures — throw typed `{Module}Error.*`
- Repos NEVER throw — service maps `undefined` to the right error
- Error factories in `{module}.internal.ts`:
  ```ts
  export const XError = {
    notFound: (id: number) => new NotFoundError('...', { code: 'X_NOT_FOUND', context: { id } }),
    createFailed: () => new InternalServerError('...', { code: 'X_CREATE_FAILED' }),
  }
  ```

---

## Import Order & Style

```ts
// 1. External packages
import { z } from 'zod'
import { eq, inArray } from 'drizzle-orm'

// 2. Internal absolute (@/ aliases), grouped by layer
import { locationsTable } from '@/db/schema'
import { paginate, takeFirst, type DbContext } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import type { ActorId, EntityRef } from '@/shared/types/utils'

// 3. Relative (sibling module files)
import type { LocationSchema } from './location.schema'
import { LocationError } from './location.internal'
```

- Use `import type` for type-only imports (enforced by `verbatimModuleSyntax`)
- Import from barrel `@/db/schema`, not sub-paths
- Never import another module's internal files — use its `index.ts` public exports
- Path alias: `@/*` → `apps/server/src/*`

---

## Database Schema

- Tables defined in `apps/server/src/db/schema/{domain}.ts`
- Use helpers from `_helpers.ts`: `pk` (serial PK), `auditBasicColumns`, `auditFullColumns`, `softDeleteColumns`
- IDs are serial integers (`zp.id`), never UUIDs (unless explicitly high-growth)
- One file per domain, ordered by dependency (referenced table first)
- Use `pgTable` + index/unique definitions in the third argument

---

## Cache Pattern

```ts
private readonly cache: CacheService

constructor(private readonly repo: IXRepo, cacheClient: CacheClient) {
  this.cache = CacheService.createWithDefaultKeys(cacheClient, '{namespace}')
}
```

- Default keys: `list`, `count`, `byId(id)`
- Read-through: `this.cache.getOrSet({ key, factory })`
- Skip undefined: `this.cache.getOrSetWithSkip({ key, factory })`
- Invalidate after every mutation: `await this.cache.invalidateStandard(id?)`
- Cross-module invalidation: use `entityTag(entity, id)` + `deleteByTags`
- Never cache cross-module reads directly

---

## Wiring a New Module

1. Create files following the template structure
2. In `_registry.ts`: add field to `Modules` interface, create in dependency order, add to return object
3. In `_routes.ts`: add `create{Module}Route(m.{module})`
4. Add cache namespace to `ConfigNamespace` union in `infra/cache/config.ts`
5. Schema changes in `db/schema/` → export from `db/schema/index.ts`
6. Gate: `bun run verify` (from `apps/server`)

---

## Verification Gate

Always run before finishing server work:

```bash
# From apps/server directory, or use --filter from root
bun run verify
```

This runs: oxlint (type-aware) + tsc --noEmit + knip + check-deps (circular dependency check).

Individual checks:
- `bun run typecheck` — TypeScript only
- `bun run lint` — oxlint only
- `bun run check-deps` — circular dependency only

---

## Key Utilities Reference

### Database (`@/infra/database`)

| Utility | Purpose |
|---------|---------|
| `takeFirst(rows)` | `rows[0] \| undefined` |
| `paginateWindow(rows, pq)` | Single-roundtrip paginated result |
| `toLimitOffset(pq)` | Convert page/limit to limit/offset |
| `sortBy(column, dir)` | OrderBy clause |
| `searchFilter(col, term)` | Escaped ILIKE |
| `searchAcross(term, cols)` | OR-ed ILIKE across columns |
| `allOf(...) / anyOf(...)` | AND/OR that skip falsy |
| `eqIf(col, value)` | eq() only when defined |
| `withTransaction(db, fn)` | Wrap in transaction |
| `checkConflict(opts)` | Pre-write uniqueness check |
| `catchUniqueViolation(fn, map)` | Constraint-based conflict catch |

### Shared (`@/shared/...`)

| Import path | Key exports |
|-------------|-------------|
| `@/shared/schema` | `z`, `zp`, `zc`, `zq`, `createSuccessResponseDto`, `createPaginatedResponseDto` |
| `@/shared/audit/stamp` | `stampCreate(actorId)`, `stampUpdate(actorId)` |
| `@/shared/errors/http-error` | `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `InternalServerError` |
| `@/shared/http/response` | `res.ok`, `res.created`, `res.paginated`, `res.noData` |
| `@/shared/types/utils` | `EntityRef`, `ActorId`, `WithId<T>` |
| `@/shared/types/pagination` | `PaginationQuery`, `WithPaginationResult<T>` |
| `@/shared/utils` | `RelationMap`, `money`, `hashPassword`, `verifyPassword` |

---

## Common Pitfalls

- Do NOT use `.extend()` on Zod schemas — use spread-shape
- Do NOT return `null` from repos — return `undefined`
- Do NOT throw from repos — let the service handle it
- Do NOT put business logic in routes — routes are thin
- Do NOT import from another module's internal files — use barrel exports
- Do NOT cache cross-module reads
- Do NOT forget `import type` for type-only imports
- Do NOT use `any` — use `unknown` and narrow
- Do NOT skip `stampCreate`/`stampUpdate` on mutations
- Do NOT use `paginate` (two-roundtrip) for new code — use `paginateWindow`
- Do NOT run `db:generate` or `db:migrate` unless explicitly asked — schema changes are code-only until confirmed

---

## TypeScript Specifics

- Strict mode enabled (`strict: true`)
- No `enum` keyword — use `z.enum([...])` and infer
- No `as` assertions unless unavoidable (add comment explaining why)
- Prefer `interface` for implementable shapes; `type` for unions/intersections/inferred
- Use `function` declarations for module-level pure functions (hoisted)
- Arrow functions for inline callbacks only
