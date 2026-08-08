# Observability

Tracing and logging setup for the Ikki server — how to instrument, where to log, and what to avoid.

## OTel Tracing

### Setup

- Package: `@elysiajs/opentelemetry` + `@opentelemetry/instrumentation-pg`
- Config: `src/infra/otel/otel.ts` (preloaded via `bunfig.toml`)
- Exporter: Axiom (OTLP proto) — env vars: `AXIOM_URL`, `AXIOM_TOKEN`, `AXIOM_DATASET`
- Plugin: `otelPlugin` applied conditionally in `app.ts`

```toml
# bunfig.toml — REQUIRED for PgInstrumentation monkey-patching
preload = ["./src/infra/otel/otel.ts"]
```

### Auto-Instrumented (zero code)

| What                                           | Span source                                      |
| ---------------------------------------------- | ------------------------------------------------ |
| HTTP requests (method, path, status, duration) | `@elysiajs/opentelemetry`                        |
| Elysia lifecycle hooks                         | Named function → span name                       |
| All Postgres queries                           | `PgInstrumentation` (query text, rows, duration) |

### Manual `record()` — Placement Rules

Import: `import { record } from '@/infra/otel/otel.ts'`

```ts
async handleComplete(data, actorId) {
  return record('order.complete', async () => {
    // orchestration logic
  })
}
```

**When to record:**

| Scenario                   | Why                                   | Examples                                       |
| -------------------------- | ------------------------------------- | ---------------------------------------------- |
| Cross-module orchestration | Multiple service calls in one handler | `order.complete`, `auth.login`                 |
| Batch operations           | Loop with multiple DB writes          | `order.deductStock`, `receiving.confirm`       |
| Expensive computation      | CPU + I/O combined                    | `stock.recordMovement` (check + calc + upsert) |

**Never record:**

| Anti-pattern                               | Reason                                 |
| ------------------------------------------ | -------------------------------------- |
| Pure functions (calculator, validators)    | No I/O, instant                        |
| Simple repo calls (`findById`, `findPage`) | Already traced by PgInstrumentation    |
| Zod validation                             | Microseconds                           |
| Cache get/set                              | In-memory, instant                     |
| Individual loop iterations                 | N spans per request = unreadable trace |

**Golden rule:** 3-7 custom spans per complex request. If >15, over-instrumented.

### Naming Convention

Format: `{module}.{action}` — lowercase, dot-separated.

### Current Placements

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

### Environment Behavior

| Env         | Behavior                                                |
| ----------- | ------------------------------------------------------- |
| development | OTel active, exports to Axiom if env vars present       |
| test        | `otelPlugin = undefined`, `record()` callable but no-op |
| production  | OTel active, exports to Axiom, BatchSpanProcessor       |

---

## Logging

### Setup

- Library: `@logtape/logtape` (zero-dep, Bun-native, structured)
- OTel bridge: `@logtape/otel` (auto-attaches traceId + spanId to logs)
- Dev sink: `@logtape/pretty` (colored terminal)
- Prod sink: `@logtape/otel` → Axiom (structured JSON via OTLP)
- Config: `src/infra/logger/index.ts`

### Usage

```ts
import { getLogger } from '@/infra/logger/index.ts'

const logger = getLogger(['pos', 'order'])

logger.info('Order completed', { orderId, total, paymentCount })
logger.warn('Stock deduction skipped, insufficient stock', { materialId, available, requested })
logger.error('Audit log write failed', { error: err.message, entity, entityId })
```

### Log Levels

| Level | When                                              | Prod visible  |
| ----- | ------------------------------------------------- | ------------- |
| debug | Dev-only intermediate state, DB result inspection | No (filtered) |
| info  | Business events: created, completed, shipped      | Yes           |
| warn  | Recoverable degraded paths: no recipe, low stock  | Yes           |
| error | Failures needing human attention: write failures  | Yes           |

### Logger Categories

Hierarchical, filterable. Always prefix with module path:

```ts
getLogger(['server']) // startup, shutdown
getLogger(['otel']) // OTel init
getLogger(['auth']) // login, logout, session
getLogger(['pos', 'order']) // order lifecycle
getLogger(['pos', 'deduction']) // stock deduction
getLogger(['inventory', 'stock']) // movements
getLogger(['inventory', 'receiving']) // goods receipt
getLogger(['audit']) // audit write failures
```

### Request Context

Use `withLogContext()` in route handlers to inject requestId, userId, locationId into all logs within the call tree:

```ts
import { withLogContext } from '@/infra/logger/request-context.ts'

.post('/order/complete', (ctx) =>
  withLogContext(ctx, () => service.handleComplete(ctx.body, ctx.auth.userId))
)
```

Every log inside that handler (and all nested service calls) automatically gets:

- `requestId` — unique per request
- `userId` — from auth context
- `locationId` — from auth context

Don't add these manually to log properties.

### Rules

1. **Never `console.log/warn/error`** — always `getLogger()`
2. **Structured properties** — `logger.warn('msg', { key: val })`, never template literals in message
3. **Log at boundaries** — start/end of operations, not every intermediate step
4. **Never log sensitive data** — passwords, tokens, full request bodies, PII
5. **Don't log what traces already show** — individual DB queries, cache lookups
6. **Error objects** — pass as `{ error: err.message }` or `{ error: err }` (OTel sink handles serialization)

### Log ↔ Trace Correlation

`@logtape/otel` automatically attaches `traceId` + `spanId` to every log record. In Axiom: click a log → jump to its trace, or click a trace → see related logs.

### Environment Behavior

| Env         | Sink                         | Level  |
| ----------- | ---------------------------- | ------ |
| development | `@logtape/pretty` (terminal) | debug+ |
| test        | None (silent)                | —      |
| production  | `@logtape/otel` → Axiom      | info+  |

---

**Next:** [08-money-precision.md](./08-money-precision.md) — Decimal arithmetic guide.
