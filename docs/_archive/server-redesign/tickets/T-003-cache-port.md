# T-003: `CachePort` + memory adapter

**Tracker row:** P0.3
**Depends on:** —
**Type:** foundation

## Goal
`shared/cache/cache.port.ts` defines `CachePort`; `infra/cache/cache.memory.ts` implements it over BentoCache memory.

## Read first
- [05-cache-port.md](../05-cache-port.md)

## Build
1. Create `shared/cache/cache.port.ts` with `CachePort` (getOrSet, getOrSetOptional, invalidate, invalidateKeys) — spec 05 §1.
2. Create `infra/cache/cache.memory.ts` with the BentoCache-backed adapter — spec 05 §2. Key format `<namespace>:<key>`.

## Definition of done
- `getOrSetOptional` does NOT cache `undefined`.
- `invalidate('ns', id)` clears `ns:list`, `ns:count`, `ns:byId:<id>`.
- Self-check test: set via getOrSet, then invalidate, assert refetch calls the factory again.
- `bun run verify` + `bun run test` green.

## Notes / gotchas
App code depends only on `CachePort`. A Redis adapter later implements the same interface — do not leak BentoCache types past this file.
