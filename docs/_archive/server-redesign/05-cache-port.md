# Cache Port Spec

Caching behind a swappable port. Implements ADR-0006. Read [00-glossary.md](./00-glossary.md) first.

## Rule (one sentence)

> App-layer use-cases depend on `CachePort`, never on a cache library. Cache is non-critical: invalidate **after commit**, and a miss must always fall back to the source of truth.

## 1. CachePort (shared/cache/cache.port.ts)

```ts
export interface CachePort {
  /** Read-through: return cached value or compute, store, and return it. */
  getOrSet<T>(namespace: string, key: string, factory: () => Promise<T>, ttlSeconds?: number): Promise<T>
  /** Read-through that does NOT cache `undefined` (for "may not exist" lookups). */
  getOrSetOptional<T>(namespace: string, key: string, factory: () => Promise<T | undefined>): Promise<T | undefined>
  /** Invalidate the standard keys for a namespace (list + count), and one entity if given. */
  invalidate(namespace: string, id?: number): Promise<void>
  /** Invalidate an explicit set of fully-qualified keys. */
  invalidateKeys(keys: string[]): Promise<void>
}
```

Key convention (built by the adapter, stable across modules):

| Logical key | Format |
| --- | --- |
| entity by id | `<namespace>:byId:<id>` |
| list | `<namespace>:list` |
| count | `<namespace>:count` |

## 2. Memory adapter (infra/cache/cache.memory.ts)

Wraps the existing BentoCache memory store behind the port.

```ts
import { BentoCache, bentostore } from 'bentocache'
import { memoryDriver } from 'bentocache/drivers/memory'
import type { CachePort } from '@/shared/cache/cache.port.ts'

const bento = new BentoCache({
  default: 'memory',
  stores: { memory: bentostore().useL1Layer(memoryDriver({ maxSize: 1000 })) },
})

const k = (ns: string, key: string) => `${ns}:${key}`

export const cache: CachePort = {
  async getOrSet(ns, key, factory, ttlSeconds) {
    return ttlSeconds
      ? bento.getOrSet({ key: k(ns, key), factory, ttl: `${ttlSeconds}s` })
      : bento.getOrSet({ key: k(ns, key), factory })
  },
  async getOrSetOptional(ns, key, factory) {
    const existing = await bento.get({ key: k(ns, key) })
    if (existing !== undefined && existing !== null) return existing as never
    const fresh = await factory()
    if (fresh !== undefined) await bento.set({ key: k(ns, key), value: fresh })
    return fresh
  },
  async invalidate(ns, id) {
    await bento.delete({ key: k(ns, 'list') })
    await bento.delete({ key: k(ns, 'count') })
    if (id !== undefined) await bento.delete({ key: k(ns, `byId:${id}`) })
  },
  async invalidateKeys(keys) {
    await Promise.all(keys.map((key) => bento.delete({ key })))
  },
}
```

> **Redis later:** implement the same `CachePort` with a Redis-backed store; no app-layer change. That is the whole point of the port (ADR-0006).

## 3. Usage (in a use-case)

```ts
// read
const entity = await deps.cache.getOrSetOptional('location', `byId:${id}`, () => deps.repo.findById(id))

// write — invalidate AFTER uow.run returns
const ref = await deps.uow.run(async (tx) => { ... })
await deps.cache.invalidate('location', ref.id)
```

## 4. Hard rules

- Invalidate **after commit**, never inside `uow.run`.
- A cache miss falls back to the repo (source of truth) — the cache is never authoritative.
- Do not cache inside the domain layer. Caching is an app-layer concern via the port.
- TTL for lists/aggregates; event-based invalidation for entity/reference data (unchanged strategy from `docs/database/caching.md`).

---

**Next:** [06-rbac.md](./06-rbac.md)
