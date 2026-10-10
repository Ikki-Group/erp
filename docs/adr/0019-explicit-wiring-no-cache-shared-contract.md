# ADR-0019: Explicit module wiring, no business caching, shared contract package

**Status:** Accepted
**Date:** 2026-10-10
**Amends:** ADR-0001 (module wiring, §5 descriptors/Api), ADR-0018 (session store), ADR-0015 (key style)

## Context

The first redesign pass left two module systems side by side: ten modules on a `ModuleDescriptor`
registry whose `api` was `Record<string, unknown>` (so consumers duck-typed it), and the four
largest modules (auth, inventory, pos, production) behind an untyped `legacy.module.ts` adapter.
On top of that:

- Two cache abstractions (a `CachePort` used by two modules, a global `CacheService` used by 23
  services) with hand-written invalidation, plus tracked keys in stock.
- An event bus with publishers but no subscribers. Publishing was pushed onto callers via
  `if (!db)` branches.
- Side effects such as table status ran after the commit.
- The web hand-copied every server DTO (about 2,500 lines) and kept three query-key styles.

## Decision

1. **Explicit typed wiring.** Each module's `index.ts` exports `createXModule(infra, deps)`.
   `src/modules/index.ts` builds them in dependency order and returns the routes. Neighbours are
   typed as `Pick<NeighbourService, '...'>` and imported only from the neighbour's `index.ts`. The
   compiler enforces ordering and the API surface, so there is no registry, no descriptor and no
   cast.
2. **No business-data caching.** Reads go to Postgres; the data volume of a few stores doesn't
   need a cache, and wrong invalidation is a correctness bug. The only cache (`infra/cache.ts`,
   bento L1 plus optional Redis L2 and bus) serves the auth hot path: session lookup, access map
   (tagged by role) and the last-seen throttle.
3. **No event bus** until there is a subscriber.
4. **Sessions** live in `sessions` in Postgres (the source of truth), cached by `infra/cache`.
   Bearer tokens are random 256-bit values and only their SHA-256 is stored. Revocation calls
   `forgetSessions(ids)`. This replaces ADR-0018's `SessionStore` port.
5. **One transaction per use-case.** All writes, cross-module writes (stock movements, voucher
   usage, table status) and the audit row run in one `uow.run`, with `tx` passed through
   (`audit.record(tx, actor, entry)`). Concurrency on documents uses row locks (`lockOpen`) or
   conditional updates. Unique-index violations map to HTTP 409.
6. **Pure math in calculators.** Money and quantity math lives in `*.calculator.ts` with unit
   tests: stock (weighted average), production, recipe (HPP), order, shift, voucher and inventory.
7. **`@ikki/contract`** (`packages/contract`) holds every Zod request/response DTO plus the
   `zp`/`zc`/`zq` primitives, `zRes` envelopes and the permission catalog. The server and web both
   import it, so the web keeps no DTO copies. Money in request bodies is a decimal string
   (`zc.decimal`), never a JS number.
8. **Web.** There is one key style (`createResourceKeys`). Data the server scopes to a location is
   `locationScoped`, and mutations invalidate the unscoped `keys.root()`. The active location is
   a module store (`useActiveLocationId`). Only 401 logs the user out.

## Consequences

- Adding a module means writing a factory and one wiring line. A missing dependency is a
  compile error.
- Performance work, if it is ever needed, starts with indexes and queries, not caches.
- Migrations were squashed into `0000_init` (no deployed data existed).
