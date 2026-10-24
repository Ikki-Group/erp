# Audit & Error Handling Spec

Reliable audit (ADR-0009) and the error model. Read [00-glossary.md](./00-glossary.md) first.

## Part A — Audit

### Rule (one sentence)

> An audit entry is written **inside** the use-case's UoW via `AuditPort.record(entry, tx)`, awaited, with a non-empty actor label. If the operation rolls back, its audit row does not exist.

### AuditPort (shared/audit/audit.port.ts)

```ts
export interface AuditEntry {
  actorId: number
  actorName: string          // REQUIRED, non-empty — no more `userName: ''`
  locationId?: number | null
  module: string
  entity: string
  entityId: number
  action: 'create' | 'update' | 'delete' | string   // domain verbs allowed (e.g. 'complete', 'void')
  summary: string
  oldValues?: Record<string, unknown> | null
  newValues?: Record<string, unknown> | null
}

export interface AuditPort {
  /** Writes the audit entry within the given transaction. Awaited — throws on failure. */
  record(entry: AuditEntry, tx: Tx): Promise<void>
}
```

### Adapter (infra/audit/audit.drizzle.ts)

```ts
export const auditPort: AuditPort = {
  async record(entry, tx) {
    if (!entry.actorName) throw new Error('audit actorName is required')
    await tx.insert(auditLogs).values({ ...entry, oldValues: entry.oldValues ?? null, newValues: entry.newValues ?? null })
  },
}
```

### Building an entry (helper per module)

```ts
// app/<entity>.audit.ts
export function <entity>Audit(action: string, actor: Actor, e: { id: number; name: string; code: string }, extra?): AuditEntry {
  return {
    actorId: actor.id,
    actorName: actor.name,             // from actorOf(auth) — never empty
    locationId: actor.locationId,
    module: '<module>',
    entity: '<entity>',
    entityId: e.id,
    action,
    summary: `${verbFor(action)} <entity> "${e.name}" (${e.code})`,
    ...extra,
  }
}
```

### Hard rules

- `record` is called **inside** `uow.run`, with the same `tx`, awaited.
- `actorName` must be non-empty (enforced by the adapter).
- Audit is **atomic** (ADR-0003 classification) — never an event, never fire-and-forget.

## Part B — Error handling

### Error hierarchy (unchanged base, `shared/errors/`)

`NotFoundError`, `ConflictError`, `ForbiddenError`, `ValidationError`, `UnauthorizedError`, `InternalServerError` — each carries `{ code, context }`. A global error plugin maps them to HTTP status codes and the standard error response shape.

### Per-module error factories (domain/`<entity>.errors.ts`)

Error factories live in the **domain** layer (they express domain failures) and are imported by `app` use-cases.

```ts
export const OrderError = {
  notFound: (id: number) => new NotFoundError('Order not found', { code: 'ORDER_NOT_FOUND', context: { id } }),
  notOpen: (id: number) => new ConflictError('Order is not open', { code: 'ORDER_NOT_OPEN', context: { id } }),
  insufficientStock: (materialId: number, need: string, have: string) =>
    new ConflictError('Insufficient stock', { code: 'STOCK_INSUFFICIENT', context: { materialId, need, have } }),
  updateFailed: (id: number) => new InternalServerError('Order update failed', { code: 'ORDER_UPDATE_FAILED', context: { id } }),
}
```

### Where each error type belongs

| Situation | Error | Layer that throws |
| --- | --- | --- |
| Entity missing | `NotFoundError` | app (after repo read) |
| Invariant / state violation (order not open, insufficient stock) | `ConflictError` | domain rule fn / app |
| Unique constraint | `ConflictError` | app (via conflict check) |
| Missing permission | `ForbiddenError` | RBAC macro |
| Invalid input shape | `ValidationError` | contract (Zod) — automatic |
| Unexpected write failure | `InternalServerError` | app |

### Domain rules throw, they don't return booleans

```ts
// domain/order.rules.ts
export function assertOrderOpen(order: Order): void {
  if (order.status !== 'open') throw OrderError.notOpen(order.id)
}
```

### Hard rules

- Domain rule functions are named `assert<Rule>` and **throw** typed errors — they do not return `false`.
- The insufficient-stock case is now a **thrown `ConflictError` inside the UoW**, so order completion rolls back (this is the P0 fix expressed as an error path). It is no longer a swallowed `logger.warn`.
- Every thrown error has a stable `code` for the client.

---

**Next:** [08-read-cqrs.md](./08-read-cqrs.md)
