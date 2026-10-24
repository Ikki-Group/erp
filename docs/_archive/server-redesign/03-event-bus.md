# In-Process Event Bus Spec

How non-critical cross-module effects are delivered. Implements ADR-0003. Read [00-glossary.md](./00-glossary.md) first.

## The sync-vs-event decision (mechanical — no judgement)

For any effect a use-case triggers in another concern, look it up:

| Question | Answer → | Mechanism |
| --- | --- | --- |
| Must this effect roll back if the operation rolls back? | **Yes** | **Atomic** → synchronous call inside the UoW, passing `tx` (see [02](./02-transaction-uow.md)) |
| Can this effect fail or lag on its own without invalidating the operation? | **Yes** | **Non-critical** → publish a domain event after commit |

**Fixed classification (do not re-decide):**

| Effect | Class | Mechanism |
| --- | --- | --- |
| Deduct inventory stock on order complete | Atomic | sync in UoW |
| Increment voucher usage on order complete | Atomic | sync in UoW |
| Adjust stock on receiving / transfer / opname | Atomic | sync in UoW |
| Write audit log | Atomic | sync in UoW (awaited) |
| Send notification (email/push/webhook) | Non-critical | event |
| Refresh a dashboard/report cache | Non-critical | event |
| Analytics / metrics | Non-critical | event |

## 1. Event shape (normative)

A domain event is a plain class named in the **past tense**. It carries only IDs and primitive facts — never entities or a `tx`.

```ts
// <module>/domain/events.ts
export class OrderCompleted {
  readonly type = 'OrderCompleted' as const
  constructor(
    readonly orderId: number,
    readonly locationId: number,
    readonly total: string,   // numeric string; handlers re-load if they need more
  ) {}
}
```

## 2. EventBus port + adapter

```ts
// shared/events/event-bus.port.ts
export interface DomainEvent { readonly type: string }
export type Handler<E extends DomainEvent> = (event: E) => Promise<void> | void

export interface EventBusPort {
  publish(event: DomainEvent): void                       // fire-and-forget, post-commit
  subscribe<E extends DomainEvent>(type: E['type'], handler: Handler<E>): void
}
```

```ts
// infra/events/event-bus.memory.ts
import { getLogger } from '@/infra/logger/index.ts'
import type { DomainEvent, EventBusPort, Handler } from '@/shared/events/event-bus.port.ts'

const logger = getLogger(['events'])

export function createMemoryEventBus(): EventBusPort {
  const handlers = new Map<string, Handler<DomainEvent>[]>()
  return {
    subscribe(type, handler) {
      const list = handlers.get(type) ?? []
      list.push(handler as Handler<DomainEvent>)
      handlers.set(type, list)
    },
    publish(event) {
      const list = handlers.get(event.type) ?? []
      for (const handler of list) {
        // isolate each handler: one failing handler must not affect others or the caller
        void Promise.resolve()
          .then(() => handler(event))
          .catch((err) => logger.warn('event handler failed', {
            type: event.type,
            error: err instanceof Error ? err.message : String(err),
          }))
      }
    },
  }
}
```

## 3. Publishing (in a use-case)

Publish **after** `uow.run` returns (after commit). Never inside the transaction.

```ts
const ref = await deps.uow.run(async (tx) => { ... return { id } })
deps.events.publish(new OrderCompleted(ref.id, locationId, total))   // post-commit
```

## 4. Subscribing (module wiring)

A module registers its subscriptions in its factory (`<module>.module.ts`), against ports it owns.

```ts
// notification.module.ts (illustrative)
export function createNotificationModule(deps: { events: EventBusPort; ... }) {
  deps.events.subscribe('OrderCompleted', async (e: OrderCompleted) => {
    await sendReceiptNotification(e.orderId)
  })
  return { /* routes if any */ }
}
```

## 5. Hard rules

- Events are **past-tense facts**, published **after commit**. If the effect must be atomic, it is NOT an event — see the classification table.
- Handlers must be **idempotent** (an event may be re-delivered in future transports) and must **never throw to the publisher** — the bus isolates and logs failures.
- A handler that needs full data **re-loads** it by ID; events carry IDs, not entities.
- No event carries a `tx`. Handlers open their own UoW if they write.
- In-process only. No external broker at this stage (ADR-0003). The port shape leaves that door open.

## 6. Anti-patterns

```ts
// ❌ using an event for an atomic effect
deps.events.publish(new OrderCompleted(id))   // and a subscriber deducts stock → NOT atomic, re-introduces the P0

// ❌ publishing inside the transaction
await deps.uow.run(async (tx) => { deps.events.publish(...) })

// ❌ handler throws to publisher
deps.events.subscribe('X', async () => { throw new Error() })   // must catch internally
```

---

**Next:** [04-value-objects.md](./04-value-objects.md)
