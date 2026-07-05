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

Drizzle helpers shared by every repo. Pure functions + types, no state.

| Export                              | Purpose                                                                                  |
| ----------------------------------- | ---------------------------------------------------------------------------------------- |
| `DbContext` / `DbClient` / `DbTx`   | The DB handle types. `DbContext = DbClient \| DbTx` — repos accept it so writes can join a caller's transaction. |
| `withTransaction(db, fn)`           | Run `fn` atomically. If `db` is already a `DbTx`, reuses it (no nesting); else opens one. Thread the `tx` into every repo write. |
| `paginate({ data, pq, countQuery })`| Runs data + count queries in parallel (`Promise.all`), returns `{ data, meta }`. `data`/`countQuery` are thunks so any Drizzle query shape works. |
| `checkConflict(opts)`               | Generic uniqueness check. Queries each **changed** field independently for accurate attribution; on update excludes the current row via `ne(pk, existing.id)`. Requires explicit `db` (no global fallback → stays inside the caller's transaction). |
| `searchFilter(column, search)`      | `ILIKE '%term%'` condition, or `undefined` when empty. Escapes `%`, `_`, `\` so input is a literal substring. |
| `sortBy(column, dir)`               | `asc`/`desc` orderBy clause (default `desc`).                                            |
| `takeFirst(rows)`                   | `rows[0]` or `undefined` — the standard "not found = undefined" read helper.             |
| `takeFirstOrThrow(rows, msg, code)` | `rows[0]` or throws `NotFoundError`. Use sparingly (repos normally return `undefined`).  |

**Repo contract reminder:** reads return `T | undefined` (never `null`, never
throw); writes return `EntityRef | undefined`. See
[docs/server/MODULE_STANDARD.md](../../../../docs/server/MODULE_STANDARD.md).

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

  | Method                       | Use                                                                 |
  | ---------------------------- | ------------------------------------------------------------------- |
  | `getOrSet({ key, factory })` | Read-through cache.                                                  |
  | `getOrSetWithSkip(...)`      | Same, but `undefined` from the factory is NOT cached (skip).        |
  | `deleteMany({ keys, ...})`   | Invalidate keys with extra bentocache options.                      |
  | `deleteFromKeys(keys)`       | Ergonomic alias for `deleteMany({ keys })` — the common case.       |
  | `deleteByTags(tags)`         | Cross-module invalidation by tag (see `entityTag`).                 |

  `entityTag(entity, id)` → `'entity:id'`. Tag a cached read that embeds a
  foreign entity, then the owning module invalidates by tag on mutation without
  either side knowing the other's keys.

  **Convention:** invalidate via a private `invalidate(id?)` helper on the
  service that deletes `keys.list` + `keys.count` (+ `keys.byId(id)`). Prefer the
  typed `this.cache.keys.*` over hardcoded `'list'`/`'count'` strings.

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
