# Target Architecture

The target backend architecture after the redesign. Read [00-glossary.md](./00-glossary.md) first — this document uses those terms exactly.

## Stack

| Component | Technology | Change from current |
| --- | --- | --- |
| Runtime | Bun | — |
| Framework | Elysia | — |
| Database | PostgreSQL (Neon) | — |
| DB driver | `drizzle-orm/neon-serverless` (**WebSocket**) | **Changed** from `neon-http` — enables real transactions (ADR-0002) |
| ORM | Drizzle | — |
| Cache | Behind a `CachePort` (memory adapter now, Redis later) | **Changed** — was BentoCache used directly (ADR-0006) |
| Validation | Zod | — |
| Money | `decimal.js` wrapped in `Money`/`Qty` value objects | **Changed** — no leaked `Number(string)` (ADR-0005) |
| Auth | Session-based + enforced per-route RBAC macro | **Changed** — RBAC now enforced (ADR-0007) |

## The Five Layers (per module)

Each module is a vertical slice split into five folders. Dependencies point **inward**: outer layers depend on inner layers, never the reverse.

```
http  ──▶  app  ──▶  domain
                │
contract ──────┘ (app & http use contract DTOs)
                │
infra ─────────▶ app  (infra implements ports declared in app)
```

```
modules/<domain>/
├── domain/                 # PURE business logic — no I/O
│   ├── <entity>.ts         #   entity types + invariants
│   ├── <entity>.rules.ts   #   state transitions, validations (pure functions)
│   └── ...
├── app/                    # use-cases + ports
│   ├── ports.ts            #   port interfaces (repo, cache, events this module needs)
│   ├── <verb-noun>.usecase.ts
│   └── ...
├── infra/                  # adapters implementing ports
│   ├── <entity>.repo.drizzle.ts
│   └── ...
├── contract/               # Zod DTOs (HTTP boundary)
│   └── <entity>.dto.ts
├── http/                   # thin Elysia routes
│   └── <entity>.route.ts
├── read/                   # read-queries (lightweight CQRS) — optional per module
│   └── <view>.query.ts
└── <domain>.module.ts      # factory: wires adapters → use-cases → routes
```

### Layer responsibilities

| Layer | May import | May NOT import | Contains |
| --- | --- | --- | --- |
| `domain` | Other `domain` (same or lower module layer), value objects | `app`, `infra`, `http`, Drizzle, Elysia, Zod | Pure entities, invariants, rule functions |
| `app` | own `domain`, own `contract` (types), ports, other modules' **ports** or **use-cases** (downward) | own/other `infra`, `http`, Drizzle, Elysia | Use-cases, port interfaces, UoW orchestration |
| `infra` | own `app` (to implement ports), `domain`, Drizzle, cache/event libs | `http`, other modules' `infra` | Repo/cache/event adapters |
| `contract` | Zod, shared Zod primitives | anything with logic | DTOs only |
| `http` | own `app` (use-cases), own `contract`, RBAC macro, response helpers | `domain`, `infra`, Drizzle | Thin routes |
| `read` | Drizzle, own `contract` (response DTOs) | write-services, `domain` | Optimized read-queries |

> **Key inversion:** `infra` depends on `app` (it implements the app's ports), not the other way around. The app layer never names a concrete adapter.

## Module Dependency Layers (unchanged)

The 4-tier layering from the current architecture is preserved. Modules import **downward** only.

```
Layer 3  Aggregators   dashboard, reporting
Layer 2  Operations    pos, inventory, production, finance, hr, crm
Layer 1  Master data   iam, location, material, menu, uom, supplier, recipe, payment-method
Layer 0  Core          auth, company, audit
```

**Cross-module rule (redesigned):** A module reaches another module only through that module's **app-layer use-case or port** (downward), or through a **domain event** (for non-critical effects). Never through another module's `infra`, repo, or tables directly.

## Request Flow (write use-case)

```
HTTP request
  → http route: validate body/query via contract DTO
  → RBAC macro: enforce required permission (throws Forbidden if missing)
  → app use-case (verbNoun):
      ┌─ open Unit of Work (transaction) ─────────────────────────┐
      │  1. load entities via repo port (tx)                       │
      │  2. run domain rules (pure) — compute, validate invariants │
      │  3. persist via repo port (tx)                             │
      │  4. run ATOMIC effects synchronously (tx)  e.g. deduct stock│
      │  5. write audit via audit port (tx)                        │
      └─ commit (or roll back everything on any throw) ────────────┘
      6. after commit: publish domain events (non-critical effects)
      7. invalidate cache via cache port
  → http route: wrap in res.ok / res.created / res.paginated
```

**The atomicity guarantee:** steps 1–5 are all-or-nothing. If stock deduction (step 4) fails because stock is insufficient, the order completion (step 3) rolls back too. This directly fixes the current P0 where stock deduction was fire-and-forget after the order was already marked completed.

## Request Flow (read-query)

```
HTTP request
  → http route: validate query via contract DTO
  → RBAC macro: enforce required permission
  → read-query: single optimized SELECT (may JOIN), maps rows → response DTO
  → http route: wrap in res.ok / res.paginated
```

Read-queries bypass the domain and write-service entirely. They never mutate. This is the "lightweight CQRS" split (ADR-0004): separated in code, same tables, no projection to keep in sync.

## Hybrid Cross-Module Communication (ADR-0003)

The mechanical rule the implementer follows, with **no judgement required**:

> **If an effect must roll back together with the operation → call it synchronously inside the UoW (as a use-case/port of the other module, passing the `tx`).**
> **If an effect may fail or lag on its own without invalidating the operation → publish a domain event after commit; the other module subscribes.**

| Effect | Classification | Mechanism |
| --- | --- | --- |
| Deduct inventory stock on order complete | Atomic | Synchronous, in UoW |
| Increment voucher usage on order complete | Atomic | Synchronous, in UoW |
| Write audit log | Atomic | Synchronous, in UoW (awaited) |
| Send notification | Non-critical | Domain event |
| Update a dashboard/reporting cache | Non-critical | Domain event |
| Analytics / external webhook | Non-critical | Domain event |

## Unit of Work (ADR-0002)

A write use-case receives a `UnitOfWork` (or opens one) and runs its body inside `db.transaction()`. Every repo method accepts the transaction handle. The full template is specified in Stage 2's transaction spec; the shape:

```ts
// app/complete-order.usecase.ts (shape only — full template in Stage 2)
export function makeCompleteOrder(deps: CompleteOrderDeps) {
  return async (input: CompleteOrderInput, actor: Actor): Promise<EntityRef> => {
    const ref = await deps.uow.run(async (tx) => {
      const order = await deps.orderRepo.findById(input.orderId, tx)      // load
      assertOrderOpen(order)                                              // domain rule (pure)
      await deps.orderRepo.markCompleted(order.id, actor, tx)             // persist
      await deps.deductStock(order, tx)                                   // ATOMIC effect (sync)
      await deps.auditPort.record(auditEntry(order, actor), tx)           // audit in tx
      return { id: order.id }
    })
    deps.events.publish(new OrderCompleted(ref.id))                       // non-critical, post-commit
    await deps.cache.invalidate(...)                                      // cache
    return ref
  }
}
```

## What This Fixes (traceability to pain points)

| Pain point (from investigation) | Severity | Fixed by |
| --- | --- | --- |
| `withTransaction` is a no-op | P0 | ADR-0002: real transactions via Neon WebSocket + explicit UoW |
| Stock deduction fire-and-forget after complete | P0 | Atomic effect inside UoW (this doc, request flow) |
| Boolean stored as `integer 0/1` | P1 | ADR-0008: native Postgres boolean |
| RBAC evaluated but never enforced | P1 | ADR-0007: enforced per-route RBAC macro |
| Audit fire-and-forget, `userName` empty | P1 | ADR-0009: audit awaited in UoW, actor name resolved |
| Manual DI assembly in `app.ts` fragile | P2 | ADR-0010: declarative module registry |
| `Number(string)` money leaks | P2 | ADR-0005: Money/Qty value objects |
| Memory-only cache blocks scale-out | P2 | ADR-0006: cache behind a port |

---

**Next:** [adr/](./adr/) — the decision records behind each choice above.
