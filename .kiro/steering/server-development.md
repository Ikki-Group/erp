---
inclusion: fileMatch
fileMatchPattern: 'apps/server/**'
---

# Server Development

Guide for building and modifying `apps/server` features.

## Required Reading

1. #[[file:docs/server/06-module-map.md]] — module registry, layers, dependencies
2. #[[file:docs/server/02-module-standard.md]] — file structure (source of truth)
3. #[[file:docs/server/04-code-patterns.md]] — copy-ready code snippets
4. #[[file:docs/server/03-code-standard.md]] — naming, imports, TS style
5. #[[file:docs/database/caching.md]] — caching strategy

For domain context: #[[file:docs/product/readme.md]], #[[file:docs/database/readme.md]]

## Verification Gate

```bash
bun run verify  # from apps/server/
```

Runs: oxlint (type-aware) + tsc --noEmit + knip + check-deps.

## Non-Negotiable Rules

1. Vertical slice — module owns schema/repo/service/route/internal/module
2. Spread-shape Zod — never `.extend()`
3. Repos never throw — return `T | undefined`
4. Routes are thin — validate → `handleX` → `res.*`
5. `import type` for type-only imports
6. Stamp every mutation — `stampCreate(actorId)` / `stampUpdate(actorId)`
7. Invalidate cache after every write
8. No upward imports — Layer 2 → Layer 1 only
9. Cross-module via service — never import repo/internal from outside
10. No `db:generate`/`db:migrate` unless user asks

## Money / Decimal

Use `@/shared/utils/money.ts`. Never `parseFloat()` on monetary values.

- Prices (IDR): integer `number` — `roundPrice()`
- Cost (weighted avg): `Decimal` → string 4dp — `roundCost()`
- Conversions: `Decimal` 6dp — `roundQty()`
- Round at boundaries only, full precision in intermediate steps
- Zod: prices = `z.coerce.number().int().min(0)`, costs = `z.string()`

Full guide: #[[file:docs/server/08-money-precision.md]]

## Observability

### OTel Tracing

- Auto: HTTP requests, lifecycle hooks, PG queries (zero code)
- Manual: `record('module.action', fn)` from `@/infra/otel/otel.ts`
- Only at boundaries: orchestrations, batch ops, expensive calcs
- 3-7 custom spans per complex request max
- Format: `{module}.{action}` lowercase dot-separated
- Disabled in test (no-op)

### Logging

- Use `getLogger(['module', 'sub'])` from `@/infra/logger/index.ts`
- Never `console.log/warn/error`
- Levels: debug (dev), info (business events), warn (degraded), error (failures)
- Structured props: `logger.warn('msg', { key: value })` — no template literals
- Request context auto-injected via `withLogContext(ctx, fn)` in routes
- Never log sensitive data (passwords, tokens, full bodies)
- Disabled in test (no sinks)

Full guide: #[[file:docs/server/07-observability.md]]

## Environment & Config

- All env vars via `@/shared/config/env.ts` — Zod-validated, fail-fast on startup
- Never use `Bun.env` or `process.env` directly in modules
- Derived helpers: `isTest`, `isProd`, `isDev` from same file
- Cross-cutting constants: `@/shared/config/index.ts`
- Module-specific constants: stay in module's `internal.ts`
