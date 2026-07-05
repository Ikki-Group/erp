# Shared

Domain-agnostic building blocks used across modules. Depends on `infra/` and
`types/`; **never** imports from `modules/`. Import via sub-paths (there is no
root `shared/index.ts`).

## `schema/` — Zod primitives (`zp` / `zc` / `zq`)

Shared validation building blocks for contracts. Import from `@/shared/schema`.

- `zp.*` — raw primitives for **output/entity** DTOs (`zp.str`, `zp.id`, `zp.bool`, `zp.date`, `zp.decimal`).
- `zc.*` — validated/trimmed primitives for **input/mutation** DTOs (`zc.strTrim`, `zc.email`, `zc.password`) + reusable shapes (`zc.AuditBasic`, `zc.RecordId`).
- `zq.*` — **query** primitives that COERCE strings (`zq.recordId`, `zq.ids`, `zq.pagination`, `zq.search`, `zq.boolean`).
- `response.ts` — `createSuccessResponseDto` / `createPaginatedResponseDto` envelope schemas.

See [docs/server/MODULE_STANDARD.md § 7](../../../../docs/server/MODULE_STANDARD.md) for when to use which.

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
