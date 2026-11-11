# ADR-0006: Cache Behind a Port

**Status:** Accepted
**Date:** 2026-09-05

## Context

The cache is BentoCache with a memory (L1) driver, used directly via a `CacheService` wrapper. A memory-only cache cannot be shared across instances, so the app cannot scale horizontally — a cached value set on one instance is invisible to another, and invalidation on one does not reach the others. The redesign should not close the door to multi-instance deployment even though it is not needed today.

## Decision

Define a `CachePort` interface in the shared layer (`getOrSet`, `get`, `set`, `invalidate`, namespaced keys). Provide a memory adapter now (backed by the existing BentoCache memory store). A Redis adapter can be added later implementing the same port, with no change to app-layer code.

App-layer use-cases depend on `CachePort`, never on BentoCache directly.

## Alternatives Considered

- **Keep using BentoCache directly.** Rejected: couples every service to one library and blocks a future distributed cache.
- **Switch to Redis now.** Rejected: unnecessary infra at R&D stage; the port lets us defer the choice without cost.

## Consequences

- **Easier:** cache implementation is swappable; app code is decoupled from the cache library. Testing can inject a fake `CachePort`.
- **Harder:** one more port to wire. Mitigated by the module factory template.
- **Constraint:** cache is a non-critical concern — invalidation happens after commit, and a cache miss must always fall back to the source of truth. The exact `CachePort` API is specified in Stage 2.
