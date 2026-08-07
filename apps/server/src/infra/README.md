# Infra

Technical infrastructure the modules depend on. **No business logic lives here**
— only cross-cutting concerns: database access helpers, caching, telemetry, and
logging. Modules import from `infra/`, never the reverse.

Import via sub-path barrels (there is intentionally **no** root `infra/index.ts`
because `logger.ts` and `otel/otel.ts` have module-load side effects):

- `@/infra/database` — DB context type + query helpers
- `@/infra/cache` — cache client + `CacheService`
- `@/infra/otel` — `withSpan` telemetry helper
- `@/infra/logger` — app logger

---

## `database/`

Drizzle helpers shared by every repo. Pure functions + types, no state. One
file per concern:

| File             | Exports                                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| `types.ts`       | `DbClient` / `DbTx` / `DbContext`                                                                           |
| `row.ts`         | `takeFirst`, `takeFirstOrThrow`, `assertFound`                                                              |
| `query.ts`       | `sortBy`, `allOf`/`anyOf`, `searchFilter`/`searchAcross`, `eqIf`, `notDeleted`, `existsWhere`, `countWhere` |
| `pagination.ts`  | `paginate`, `paginateWindow`, `buildPaginationMeta`, `toLimitOffset`                                        |
| `transaction.ts` | `withTransaction`                                                                                           |
| `conflict.ts`    | `checkConflict`, `catchUniqueViolation`, `defineConflictFields`, `CheckConflictOptions`                     |

### Types

`DbContext = DbClient | DbTx`. Repos accept `db?: DbContext = this.db` so a
service can thread its `DbTx` into every write for atomic multi-write ops.

### Reads

- `takeFirst(rows)` → `rows[0] | undefined` — the standard "not found = undefined".
- `takeFirstOrThrow(rows, msg, code)` → throws `NotFoundError` (use sparingly).
- `assertFound(value, errorFactory)` → returns `value` if defined, otherwise calls `errorFactory()` and throws. The standard "get-or-throw" in service `handleX` methods.
- `existsWhere(db, table, where)` → `boolean` (`LIMIT 1`).
- `countWhere(db, table, where?)` → `number`.

### WHERE composition (DRY optional filters)

```ts
// drops undefined/false/null so optional filters inline cleanly
const where = allOf(
	searchAcross(filter.q, [users.name, users.email]), // ILIKE across columns
	eqIf(users.locationId, filter.locationId), // eq() only when defined
	eqIf(users.isActive, filter.isActive),
)
```

- `sortBy(column, 'desc')` — orderBy clause.
- `searchFilter(col, term)` — escaped `ILIKE '%term%'` (or `undefined` when empty).
- `searchAcross(term, [colA, colB])` — same, OR-ed across columns.
- `allOf(...)` / `anyOf(...)` — `AND`/`OR` that skip falsy conditions.
- `eqIf(col, value)` — `eq()` when value is set, else `undefined`.
- `notDeleted(table.deletedAt)` — `isNull(deletedAt)` soft-delete filter; compose with `allOf`.

### Pagination

Two strategies:

- **`paginateWindow(rows, pq)`** — **preferred.** Single round-trip: select
  `rowCount: sql\`count(\*) over()\``alongside your columns; it reads the total
from the first row and strips`rowCount` from the data. Best on network-bound
  DBs (Neon).

  ```ts
  const { limit, offset } = toLimitOffset(filter)
  const rows = await db
  	.select({ ...getColumns(users), rowCount: sql<number>`count(*) over()` })
  	.from(users)
  	.where(where)
  	.orderBy(sortBy(users.updatedAt))
  	.limit(limit)
  	.offset(offset)
  return paginateWindow(rows, filter)
  ```

- **`paginate({ data, pq, countQuery })`** — two queries in parallel. Use when
  the count differs from the data query (joins, DISTINCT, grouped counts).

  `buildPaginationMeta(total, pq)` / `toLimitOffset(pq)` are exposed for custom
  flows. Reference: `location.repo.ts` uses `paginateWindow`.

### Uniqueness / conflicts

Two complementary tools:

- **`checkConflict(opts)`** — read-before-write. Queries each **changed** field
  independently for precise per-field error attribution; on update excludes the
  current row. Throws `ConflictError` directly — no manual null-check needed.
  Requires explicit `db` (stays in the caller's transaction). Not race-proof on
  its own.

- **`defineConflictFields<T>()([...])`** — type-safe conflict field builder.
  Constrains `field` to keys of `T`, catching typos at compile time:

  ```ts
  const uniqueFields = defineConflictFields<LocationCreateDto>()([
  	{ field: 'name', column: locationsTable.name, message: '...', code: '...' },
  ])
  ```

- **`catchUniqueViolation(fn, map)`** — wraps a write, catches Postgres
  `23505 unique_violation`, and throws a typed `ConflictError` mapped from the
  violated **constraint name**. Race-free (DB is the source of truth). Use when
  the table has real unique constraints; pair with `checkConflict` for best UX +
  safety.

  ```ts
  const result = await catchUniqueViolation(
  	() => this.repo.insert(data),
  	[
  		{
  			constraint: 'users_email_unique',
  			message: 'Email already exists',
  			code: 'USER_EMAIL_ALREADY_EXISTS',
  		},
  	],
  )
  ```

**Repo contract reminder:** reads return `T | undefined` (never `null`, never
throw); writes return `EntityRef | undefined`. See
[docs/server/02-module-standard.md](../../../../docs/server/02-module-standard.md).

---

## `cache/`

Two-layer cache (L1 in-memory + optional L2 Redis) via [bentocache], with a
thin `CacheService` wrapper per module namespace.

- **`cache.ts`** — `createCache({ redisUrl })`. L1 memory always on; when
  `redisUrl` is set, adds an L2 Redis layer + a dedicated Pub/Sub **bus**
  connection for cross-instance invalidation (required on multi-machine Fly.io).
  Without Redis it is L1-only — fine for dev/tests, not for production.
- **`config.ts`** — `CACHE_TTL` tiers (`REFERENCE`/`CONFIG`/`LIST`/`VOLATILE`/
  `SECURITY`) and the `ConfigNamespace` union (every module's cache namespace).
  Pick a tier by write-frequency; don't invent per-module TTLs. TTL is a
  worst-case staleness bound — correctness comes from **eager invalidation**.
- **`cache.service.ts`** — `CacheService`, created per module:
  `CacheService.createWithDefaultKeys(client, 'location')`. Default keys:
  `list`, `count`, `byId(id)`.

  | Method                       | Use                                                           |
  | ---------------------------- | ------------------------------------------------------------- |
  | `getOrSet({ key, factory })` | Read-through cache.                                           |
  | `getOrSetWithSkip(...)`      | Same, but `undefined` from the factory is NOT cached (skip).  |
  | `deleteMany({ keys, ...})`   | Invalidate keys with extra bentocache options.                |
  | `deleteFromKeys(keys)`       | Ergonomic alias for `deleteMany({ keys })` — the common case. |
  | `deleteByTags(tags)`         | Cross-module invalidation by tag (see `entityTag`).           |
  | `invalidateStandard(id?)`    | Clears `list` + `count` + optional `byId(id)`. The go-to.     |

  `entityTag(entity, id)` → `'entity:id'`. Tag a cached read that embeds a
  foreign entity, then the owning module invalidates by tag on mutation without
  either side knowing the other's keys.

  **Convention:** every mutation calls `this.cache.invalidateStandard(id?)` which
  clears the standard keys (`list`, `count`, `byId(id)`). Use `deleteFromKeys`
  or `deleteByTags` only when extra keys or cross-module invalidation is needed.

---

## `otel/`

- **`otel.ts`** — the Elysia OpenTelemetry plugin (`otel`) + `loggerProvider`.
  Exports the OTLP/Axiom wiring; sampled 10% in production, always-on elsewhere.
  Loaded once in `app.ts`. **Has env-driven module-load side effects.**
- **`span.ts`** — `withSpan(name, fn)` / `withSpan(name, attributes, fn)`. The
  standard way to create a telemetry span; wraps `record()` and attaches
  attributes so span naming/attribute wiring stays consistent and DRY.

  ```ts
  return withSpan('LocationService.handleCreate', async () => this.repo.insert(data))
  return withSpan('CacheService.getOrSet', { 'cache.namespace': this.ns }, () => …)
  ```

---

## `logger.ts`

App logger (LogTape). `logger.info(...)`, `logger.warn(...)`, etc. Console sink;
pretty formatter when `LOG_FORMAT=pretty`, JSON lines otherwise. Configured at
module load (top-level `await configure()`) — **has a module-load side effect**,
which is why it (and `otel.ts`) are excluded from any root barrel.

[bentocache]: https://bentocache.dev
