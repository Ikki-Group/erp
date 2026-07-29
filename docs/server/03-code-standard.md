# Code Standard

Day-to-day code writing rules for the Ikki ERP server: naming, imports, TypeScript style, HTTP conventions, and deletion strategy.

## Naming conventions

### Files

| Element          | Convention                                       | Example                                   |
| ---------------- | ------------------------------------------------ | ----------------------------------------- |
| Module directory | `kebab-case`                                     | `sales-type/`, `audit-log/`               |
| Module files     | `{module}.{layer}.ts`                            | `location.repo.ts`, `location.service.ts` |
| Submodule files  | `{sub}.{layer}.ts`                               | `user.contract.ts`, `role.repo.ts`        |
| DB schema files  | `kebab-case.ts`                                  | `db/schema/inventory.ts`                  |
| Test files       | `{module}.test.ts` or `{module}.service.test.ts` | `iam.test.ts`                             |

### Identifiers

| Element                  | Convention                   | Example                                 |
| ------------------------ | ---------------------------- | --------------------------------------- |
| Classes                  | `PascalCase`                 | `LocationService`, `LocationRepo`       |
| Interfaces (ports)       | `I{Module}Repo`              | `ILocationRepo`, `ISupplierRepo`        |
| Type aliases             | `PascalCase`                 | `LocationDto`, `ActorId`                |
| Functions                | `camelCase`                  | `createLocationModule`, `stampCreate`   |
| Variables / params       | `camelCase`                  | `actorId`, `cacheClient`                |
| Constants (module-level) | `camelCase`                  | `uniqueFields`                          |
| Constants (env/config)   | `UPPER_SNAKE`                | `DATABASE_URL`                          |
| Zod schemas              | `PascalCase` (matches type)  | `LocationDto`, `LocationCreateDto`      |
| Error factories          | `PascalCase` object          | `LocationError.notFound(id)`            |
| Enums (Zod)              | `PascalCase` + `Enum` suffix | `LocationTypeEnum`, `ProductStatusEnum` |

### Factory & route functions

| Purpose              | Pattern                   | Example                |
| -------------------- | ------------------------- | ---------------------- |
| Module factory       | `create{Module}Module`    | `createLocationModule` |
| Route factory        | `create{Module}Route`     | `createLocationRoute`  |
| Sub-route (internal) | `{sub}Route` (private fn) | `categoryRoute(s)`     |

Existing `init*` or `*RouteModule` names are legacy. Migrate to `create{Module}Route` when touching those files.

## Import rules

### Ordering

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
import type { LocationDto, LocationFilterDto } from './location.contract'
import { LocationError } from './location.internal'
import type { ILocationRepo } from './location.repo'
```

### Rules

- Use `import type` for type-only imports (`verbatimModuleSyntax` enforces this).
- Import from barrel `@/db/schema`, not sub-paths. Sub-path imports are legacy.
- Never import another module's internal files. Use its `index.ts` public exports.
- Cross-module dependencies are injected via narrow interfaces, not raw imports.

## TypeScript style

### General

- Strict mode (`strict: true`, `noImplicitAny`, `exactOptionalPropertyTypes`).
- No `any`. Use `unknown` and narrow. Escape hatch: `// oxlint-disable-next-line` with explanation.
- No `as` assertions unless unavoidable (e.g., Drizzle raw results). Always add a comment.
- Prefer `interface` for implementable shapes; `type` for unions, intersections, inferred types.
- No `enum` keyword. Use `z.enum([...])` and infer the type.

### Function style

- Module-level pure functions: `function` declarations (hoisted).
- Inline callbacks: arrow functions.
- Class methods: standard method syntax (no arrow-function properties unless binding required).

### Error handling

- Never `try/catch` for expected business failures. Throw typed `{Module}Error.*`; the global `errorHandler` maps to HTTP responses.
- `try/catch` only for unexpected infra failures (DB drops, Redis timeouts). Re-throw as `InternalServerError` with context.

### Null vs undefined

| Scenario                 | Use                                            |
| ------------------------ | ---------------------------------------------- |
| Repo not-found           | Return `undefined` (never `null`, never throw) |
| DTO field nullable in DB | `.nullable()`                                  |
| DTO field may be absent  | `.optional()`                                  |

A field can be both optional AND nullable — separate concerns.

## HTTP conventions

### Methods

| Operation        | Method   | Input                        | Response                |
| ---------------- | -------- | ---------------------------- | ----------------------- |
| List             | `GET`    | query (FilterDto)            | `res.paginated(result)` |
| Detail           | `GET`    | query `zq.recordId`          | `res.ok(result)`        |
| Create           | `POST`   | body (CreateDto)             | `res.created(result)`   |
| Update (full)    | `PUT`    | body (UpdateDto, all fields) | `res.ok(result)`        |
| Update (partial) | `PATCH`  | body (partial UpdateDto)     | `res.ok(result)`        |
| Remove (single)  | `DELETE` | query `zq.recordId`          | `res.ok(result)`        |
| Remove (bulk)    | `DELETE` | body `{ ids }`               | `res.ok(result)`        |

Use `PUT` when UpdateDto includes all mutation fields (default). Use `PATCH` only when omitted fields must remain unchanged.

### Remove convention

Remove takes `id` via **query** (`zq.recordId`, coerced). Never use body for single-item delete — body on DELETE is non-standard and some proxies strip it.

### Route response

Every route declares `response:` for contract generation:

- Success with entity: `createSuccessResponseDto(EntityDto)`
- Success with ID: `createSuccessResponseDto(zc.RecordId)`
- Paginated: `createPaginatedResponseDto(EntityDto)`

## Deletion strategy

| Strategy    | When                                   | Implementation                                             |
| ----------- | -------------------------------------- | ---------------------------------------------------------- |
| Hard delete | Transient data, no audit trail needed  | `repo.remove(id)` → `DELETE FROM`                          |
| Soft delete | Master data referenced by transactions | Set `deletedAt/deletedBy`, filter with `isNull(deletedAt)` |

A module chooses ONE strategy consistently. Soft-deleted records are filtered from all reads via `#buildWhere`. Tables with FK children prefer soft delete.

## Audit & mutation rules

Audit stamps are applied in the **service** layer, never in repos. Repos accept pre-stamped data and do not take `actorId`.

- Every create: `{ ...data, ...stampCreate(actorId) }`
- Every update: `{ ...data, ...stampUpdate(actorId) }`

## Caching rules

- One `CacheService` per service: `CacheService.createWithDefaultKeys(client, namespace)`.
- Read-through: `getOrSet` (always) or `getOrSetWithSkip` (skip `undefined`).
- Every mutation calls `private async invalidate(id?: number)`.
- Standard keys: `list`, `count`, `byId(id)`.
- Never cache cross-module reads.

## Pagination

| Helper           | Round-trips      | Use when                                  |
| ---------------- | ---------------- | ----------------------------------------- |
| `paginateWindow` | 1 (window fn)    | Default for new modules                   |
| `paginate`       | 2 (data + count) | Complex queries conflicting with GROUP BY |

Both return `WithPaginationResult<T>`. The choice is internal to the repo.

## Quick decision table

| Question                             | Answer                                         |
| ------------------------------------ | ---------------------------------------------- |
| Where do audit stamps go?            | Service layer                                  |
| PUT or PATCH?                        | PUT default; PATCH for explicit partials       |
| Hard or soft delete?                 | Hard unless referenced by transactions         |
| `paginate` or `paginateWindow`?      | `paginateWindow` for new code                  |
| Barrel or sub-path schema import?    | Barrel (`@/db/schema`)                         |
| `null` or `undefined` for not-found? | `undefined` (repos); `null` in DTO fields      |
| Factory naming?                      | `create{Module}Module` / `create{Module}Route` |

---

**Next:** [04-code-patterns.md](./04-code-patterns.md) — Copy-ready code snippets.
