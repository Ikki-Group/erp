# Shared

Domain-agnostic building blocks used across modules. Depends on `infra/` and
`types/`; **never** imports from `modules/`. Import via sub-paths (there is no
root `shared/index.ts`).

## `schema/` — Zod primitives (`zp` / `zc` / `zq`)

Shared validation building blocks for contracts. Import from `@/shared/schema`.

**`zp.*` — raw output/entity primitives (no coercion):**

| Member         | Type                                  |
| -------------- | ------------------------------------- |
| `str`          | `string`                              |
| `strNullable`  | `string \| null`                      |
| `num`          | `number`                              |
| `bool`         | `boolean`                             |
| `date`         | `Date` (coerced)                      |
| `dateNullable` | `Date \| null`                        |
| `id`           | positive int                          |
| `decimal`      | numeric → `string` (Postgres numeric) |

**`zc.*` — validated/trimmed input primitives + reusable shapes:**

| Member            | Purpose                                                        |
| ----------------- | ------------------------------------------------------------- |
| `strTrim`         | trimmed string                                                |
| `strTrimNullable` | trimmed string, `''` → `null`                                 |
| `email`           | validated, lowercased, max 255                                |
| `username`        | 3–30, `[a-zA-Z0-9_]`                                          |
| `password`        | 8–100                                                         |
| `fullname`        | trimmed, 3–100                                                |
| `RecordId`        | `{ id }`                                                       |
| `AuditBasic`      | `createdAt/updatedAt/createdBy/updatedBy` — spread into entity DTOs |
| `AuditFull`       | `AuditBasic` + `deletedAt/deletedBy` (soft delete)            |
| `PaginationMeta`  | list-response meta schema (used by `createPaginatedResponseDto`) |

**`zq.*` — query primitives that COERCE (query params arrive as strings):**

| Member       | Purpose                                     |
| ------------ | ------------------------------------------- |
| `id`         | coerced positive int                        |
| `ids`        | `?id=1&id=2` or `?id=1` → `number[]`         |
| `recordId`   | `{ id }` (coerced) — for detail/remove       |
| `search`     | trimmed, `''` → `undefined`                 |
| `boolean`    | `'true'`/`'1'` → `boolean`                  |
| `pagination` | `{ page, limit }` with defaults + `.catch`  |

**`response.ts`** — `createSuccessResponseDto(dto)` / `createPaginatedResponseDto(dto)`
build the `{ success, code, data(, meta) }` envelope schemas used as route `response`.

See [docs/server/MODULE_STANDARD.md § 7](../../../../docs/server/MODULE_STANDARD.md) for when to use which prefix.

## `errors/`

- `AppError` (abstract base, `code` + `context` + `toJSON`).
- `HttpError` + concrete classes: `BadRequestError` (400), `UnauthorizedError`
  (401), `ForbiddenError` (403), `NotFoundError` (404, `+ fromEntity`),
  `ConflictError` (409), `InternalServerError` (500).
- Import from `@/shared/errors`. Modules define typed factories in their
  `{module}.internal.ts`; the global `errorHandler` maps `HttpError → status`.

## `http/`

- `res` — response body shapers: `res.ok`, `res.created`, `res.noData`,
  `res.paginated`. Only shape the body; set status via `set.status`.
- `AuthContext` / `AuthenticatedUser` — the authenticated actor; `auth.userId`
  throws `UnauthorizedError` when unauthenticated.

## `audit/`

- `stampCreate(actorId)` / `stampUpdate(actorId)` — spread into a write
  (`{ ...data, ...stampCreate(actorId) }`) to set `createdBy`/`updatedBy`/
  `createdAt`/`updatedAt` (+ optional `syncAt`). Every mutation stamps the actor.

## `types/`

- `pagination.ts` — `PaginationQuery`, `PaginationMeta`, `WithPaginationResult<T>`
  (the single source; the `paginate` helpers in `infra/database` return these).
- `utils.ts` — `EntityRef<V>` (`{ id }`), `WithId<T>`, `ActorId`, `PrimitiveId`,
  `OmitPaginationQuery<T>`.
- `*.d.ts` — ambient Elysia/Zod/global augmentations.

## `utils/`

Import from `@/shared/utils` (barrel) or the sub-path.

- **`money.ts`** — decimal-safe money math on `decimal.js` (the ONLY place that
  imports it). `money(x)` (factory), `sum(items, selector)`, `sumValues(list)`,
  `toMoneyString(x, scale)`, `ZERO`, and the `Decimal` type. Postgres `numeric`
  round-trips as strings, so **all monetary math must go through this** — never
  raw JS float.

  ```ts
  const total = sum(entry.items, (i) => i.debit) // Decimal, exact
  row.totalAmount = total.toString()             // back to numeric string
  ```

- **`relation-map.ts`** — `RelationMap` (extends `Map`) for in-memory joins:
  `fromArray`, `groupFromArray`, `getRequired`, `leftJoin`, `innerJoinRequired`,
  `innerJoinMany`. Use to avoid N+1 (batch-fetch, then join in memory).
- **`date.ts`** — WIB (UTC+7) day-boundary helpers for stock summaries.
- **`password.ts`** — `hashPassword` / `verifyPassword` (Bun.password).
- **`common.ts`** — `toArray(val)`.
