---
inclusion: fileMatch
fileMatchPattern: 'apps/server/**'
---

# Server Development

Guide for building and modifying `apps/server` features.

## Required Reading

Before creating or modifying a module, read these docs in order:

1. #[[file:docs/server/06-module-map.md]] — module registry, layers, dependencies
2. #[[file:docs/server/02-module-standard.md]] — file structure (source of truth)
3. #[[file:docs/server/04-code-patterns.md]] — copy-ready code snippets
4. #[[file:docs/server/03-code-standard.md]] — naming, imports, TS style

For domain context:

- #[[file:docs/product/readme.md]] — product index (find the relevant PRD)
- #[[file:docs/database/readme.md]] — database index (find the relevant ERD)
- #[[file:docs/database/caching.md]] — which data to cache and how

## Verification Gate

Run before finishing any server work:

```bash
bun run verify  # from apps/server/
```

Runs: oxlint (type-aware) + tsc --noEmit + knip + check-deps.

## Non-Negotiable Rules

1. **Vertical slice** — every module owns its schema/repo/service/route/internal/module files.
2. **Spread-shape** for Zod — never `.extend()`.
3. **Repos never throw** — return `T | undefined`. Service handles errors.
4. **Routes are thin** — validate → one `handleX` → `res.*` wrapper.
5. **`import type`** for type-only imports (verbatimModuleSyntax enforced).
6. **Stamp every mutation** — `stampCreate(actorId)` / `stampUpdate(actorId)`.
7. **Invalidate cache after every write** — `this.cache.invalidateStandard(id?)`.
8. **No upward imports** — Layer 2 can import Layer 1, never vice versa.
9. **Cross-module via service** — never import another module's repo or internal files.
10. **No `db:generate` / `db:migrate`** unless user explicitly asks.

## Money / Decimal Precision

All monetary arithmetic uses `decimal.js` via shared helpers. Never use native `number` for cost calculations.

```ts
import {
	Decimal,
	toDecimal,
	roundPrice,
	roundCost,
	roundQty,
	weightedAvgCost,
	safeDivide,
} from '@/shared/utils/money.ts'
```

| Domain                               | Type                   | Precision    | Example       |
| ------------------------------------ | ---------------------- | ------------ | ------------- |
| Prices (menu, payment, order totals) | `number` (integer IDR) | 0 dp         | `25000`       |
| Cost price (weighted avg)            | `Decimal` → `string`   | 4 dp         | `"5333.3333"` |
| UoM conversion factors               | `Decimal`              | 6 dp         | `"0.083333"`  |
| Tax amount (final)                   | `roundPrice(decimal)`  | Rounded once | `4400`        |

Rules:

- **No `parseFloat()` on money** — use `parseInt()` for prices, `toDecimal()` for costs
- **DB `numeric` columns** return as string via Drizzle — keep as string, pass to `toDecimal()`
- **Zod schemas**: price inputs = `z.coerce.number().int().min(0)`, cost fields = `z.string()`
- **Round at boundaries only** — keep full precision in intermediate calculations

## OpenTelemetry (OTel)

Setup: `@elysiajs/opentelemetry` + `PgInstrumentation` → Axiom exporter.

- Config: `src/infra/otel/otel.ts` (preloaded via `bunfig.toml`)
- Elysia plugin: `otelPlugin` (applied conditionally in `app.ts`)
- Manual spans: `record()` utility exported from `@/infra/otel/otel.ts`

### What is auto-instrumented (zero code needed)

- All HTTP requests (method, path, status, duration)
- All Elysia lifecycle hooks (named functions → span name)
- All Postgres queries via PgInstrumentation (query text, duration)

### When to add `record()` manually

Only at **boundaries** — cross-module orchestrations, batch operations, expensive computations:

```ts
import { record } from '@/infra/otel/otel.ts'

async handleComplete(data, actorId) {
  return record('order.complete', async () => {
    // orchestration logic here
  })
}
```

| Record when                | Examples                                                        |
| -------------------------- | --------------------------------------------------------------- |
| Cross-module orchestration | `order.complete` (status + voucher + table + stock)             |
| Batch operations           | `order.deductStock` (loop recipes × lines), `receiving.confirm` |
| Expensive computation      | `stock.recordMovement` (balance check + weighted avg + upsert)  |

| NEVER record                            | Why                                 |
| --------------------------------------- | ----------------------------------- |
| Pure functions (calculator, validators) | No I/O, instant                     |
| Simple repo calls (`findById`)          | Already traced by PgInstrumentation |
| Zod parsing                             | Microseconds                        |
| Cache get/set                           | In-memory, instant                  |
| Individual loop iterations              | Creates N spans per request = noise |

Golden rule: **3-7 custom spans per complex request.** If >15, over-instrumented.

### Naming convention

Format: `{module}.{action}` — lowercase, dot-separated.

Examples: `order.complete`, `order.syncLines`, `order.deductStock`, `stock.recordMovement`, `transfer.ship`, `receiving.confirm`, `production.confirm`, `auth.login`

### Disabled in test

`NODE_ENV=test` → `otelPlugin` is `undefined`, `record()` is still callable (no-op internally).

## Existing record() placements (reference)

| Module              | Method              | Span                   |
| ------------------- | ------------------- | ---------------------- |
| auth                | handleLogin         | `auth.login`           |
| pos/order           | handleComplete      | `order.complete`       |
| pos/order           | handleSyncLines     | `order.syncLines`      |
| pos/order           | deductStockForOrder | `order.deductStock`    |
| inventory/stock     | recordMovement      | `stock.recordMovement` |
| inventory/receiving | handleConfirm       | `receiving.confirm`    |
| inventory/transfer  | handleShip          | `transfer.ship`        |
| inventory/transfer  | handleReceive       | `transfer.receive`     |
| production          | handleOrderConfirm  | `production.confirm`   |

## Logging

Use LogTape via `getLogger()` from `@/infra/logger/index.ts`. Never use `console.log/warn/error`.

```ts
import { getLogger } from '@/infra/logger/index.ts'

const logger = getLogger(['module', 'submodule'])
```

Categories are hierarchical and filterable: `getLogger(['pos', 'order'])`, `getLogger(['inventory', 'stock'])`.

| Level | When                                           |
| ----- | ---------------------------------------------- |
| debug | Dev-only intermediate state (filtered in prod) |
| info  | Business events that happened                  |
| warn  | Recoverable degraded paths                     |
| error | Failures needing human attention               |

### Usage

```ts
// Structured properties, not string interpolation
logger.info('Order completed', { orderId, total, paymentCount })
logger.warn('Stock deduction skipped, insufficient stock', { materialId, available, requested })
logger.error('Audit log write failed', { error: err.message, entity, entityId })
```

### Request context

Wrap route handler bodies with `withLogContext()` to auto-inject requestId/userId/locationId into all logs in the call tree:

```ts
import { withLogContext } from '@/infra/logger/request-context.ts'

.post('/order/complete', (ctx) =>
  withLogContext(ctx, () => service.handleComplete(ctx.body, ctx.auth.userId))
)
```

### Rules

- Structured properties — never template literal interpolation in messages
- Log at boundaries (start/end of operations), not every step
- Never log sensitive data (passwords, tokens, full request bodies)
- requestId auto-injected via implicit context when using `withLogContext()` — don't add manually
- In test: sinks are empty (silent). In dev: pretty console. In prod: OTel → Axiom with traceId correlation.

### Disabled in test

`NODE_ENV=test` → no sinks configured, all log calls are no-ops. `getLogger()` is still callable.
