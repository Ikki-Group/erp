# Transaction & Unit of Work Spec

How write use-cases achieve atomicity. Implements ADR-0002. Read [00-glossary.md](./00-glossary.md) first.

## Rule (one sentence)

> Every **write** use-case runs its body inside exactly one `uow.run(async (tx) => { ... })`. Every repo/port call inside receives that `tx`. Reads do not open a UoW.

## 1. Driver setup (one-time, `infra/database/`)

Switch from `neon-http` to `neon-serverless` (WebSocket). This is what makes `db.transaction()` real.

```ts
// infra/database/client.ts
import { Pool, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
import ws from 'ws'

import { env } from '@/shared/config/env.ts'
import * as schema from '@/db/schema/index.ts'

// Bun provides WebSocket globally in most cases; set explicitly for safety.
neonConfig.webSocketConstructor = ws

const pool = new Pool({ connectionString: env.DATABASE_URL })
export const db = drizzle(pool, { schema })

export type DbContext = typeof db
/** The transaction handle type — same surface as db, passed as `tx`. */
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]
```

> `Tx` and `DbContext` share the same query surface, so a repo method typed `(..., db: DbContext | Tx = db)` works both inside and outside a transaction.

## 2. The UnitOfWork port

```ts
// shared/uow/uow.port.ts
import type { Tx } from '@/infra/database/client.ts'

export interface UnitOfWork {
  /** Runs `fn` inside a single DB transaction. Commits on return, rolls back on throw. */
  run<T>(fn: (tx: Tx) => Promise<T>): Promise<T>
}
```

```ts
// infra/database/uow.drizzle.ts
import { db } from './client.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'

export const uow: UnitOfWork = {
  run(fn) {
    return db.transaction((tx) => fn(tx))
  },
}
```

## 3. Repo method signature (normative)

Every repo method takes the DB context as its **last** parameter, defaulting to the module's injected `db`. Inside a UoW the use-case passes `tx`.

```ts
// infra/<entity>.repo.drizzle.ts
async findById(id: number, cx: DbContext | Tx = this.db): Promise<EntityRow | undefined> { ... }
async insert(values: EntityInsert, cx: DbContext | Tx = this.db): Promise<EntityRef | undefined> { ... }
async update(id: number, patch: EntityUpdate, cx: DbContext | Tx = this.db): Promise<EntityRef | undefined> { ... }
```

> Naming the parameter `cx` (context) avoids shadowing the module field `db` and makes "pass the tx here" obvious.

## 4. Write use-case template (normative)

```ts
// app/<verb-noun>.usecase.ts
export interface <VerbNoun>Deps {
  uow: UnitOfWork
  <entity>Repo: <Entity>RepoPort
  auditPort: AuditPort
  cache: CachePort
  events: EventBusPort
  // + other modules' use-cases/ports for ATOMIC effects
}

export function make<VerbNoun>(deps: <VerbNoun>Deps) {
  return async (input: <VerbNoun>Input, actor: Actor): Promise<EntityRef> => {
    // ── all-or-nothing block ───────────────────────────────
    const ref = await deps.uow.run(async (tx) => {
      // 1. LOAD
      const entity = await deps.<entity>Repo.findById(input.id, tx)
      assertFound(entity, () => <Entity>Error.notFound(input.id))

      // 2. DOMAIN RULES (pure — no I/O)
      assert<Rule>(entity)                     // throws on invariant violation
      const next = compute<Something>(entity, input)

      // 3. PERSIST
      const written = await deps.<entity>Repo.update(entity.id, next, tx)
      if (!written) throw <Entity>Error.updateFailed(entity.id)

      // 4. ATOMIC EFFECTS (sync, same tx) — only if any
      await deps.otherModuleUseCase(effectInput, actor, tx)

      // 5. AUDIT (awaited, in tx)
      await deps.auditPort.record(auditEntry({ actor, entity, action: '<action>' }), tx)

      return { id: entity.id }
    })
    // ── after commit ───────────────────────────────────────
    // 6. NON-CRITICAL EFFECTS (events)
    deps.events.publish(new <Entity><PastTense>(ref.id))
    // 7. CACHE
    await deps.cache.invalidate('<namespace>', ref.id)
    return ref
  }
}
```

## 5. Hard rules

- **Never** call an atomic effect outside `uow.run`. If it must roll back with the operation, it goes inside and takes `tx`.
- **Never** publish an event or invalidate cache inside `uow.run` — those run **after** commit (an event about a change that rolled back is a lie).
- **Never** do domain computation with I/O in the middle mid-transaction beyond loading/persisting — load first, compute pure, persist.
- A read use-case has **no** `uow` in its deps.
- Every repo method must accept and thread `cx`; a repo method that ignores the passed `tx` silently breaks atomicity.

## 6. Anti-patterns (do NOT do)

```ts
// ❌ effect after commit that should have been atomic
await deps.uow.run(...)          // order marked complete
deps.deductStock(order)          // separate tx — stock can fail after commit (the current P0)

// ❌ event inside the transaction
await deps.uow.run(async (tx) => {
  ...
  deps.events.publish(...)       // published even if the tx later rolls back
})

// ❌ repo ignores tx
async update(id, patch) { return this.db.update(...) }  // uses this.db, not the passed cx
```

---

**Next:** [03-event-bus.md](./03-event-bus.md)
