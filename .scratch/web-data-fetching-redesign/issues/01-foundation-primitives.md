## Parent

#40 — Web data-fetching layer redesign (TanStack Query + Router)

## What to build

The foundation primitives the rest of the redesign builds on, added **beside** the existing ones (expand phase — nothing is deleted, no call site changes yet):

- A single canonical `createQueryKeys(feature, resource)` factory producing a structured tuple key (`[feature, resource, kind, params]`), plus a location-scoped variant that folds the active `locationId` into the key.
- A freshness-tier module mapping named tiers (`static` / `standard` / `volatile` / `realtime`) to concrete Query options (`staleTime` / `gcTime` / `refetchInterval`), with the concrete numbers chosen and living in one place.
- A module-level active-location accessor (`setActiveLocationAccessor(() => number | null)`) mirroring the existing `setTokenAccessor` pattern, so framework code can read the active `locationId` with no hook and no circular dependency.

## Acceptance criteria

- [ ] `createQueryKeys(feature, resource)` returns a structured, predictable key shape and is unit-tested (deterministic arrays for `lists`/`list`/`details`/`detail`).
- [ ] Location-scoped key variant folds the active `locationId` in and is unit-tested (same params + different location → different keys).
- [ ] Freshness tiers resolve to concrete `staleTime`/`gcTime`/`refetchInterval` in one module and are unit-tested (tier in → expected options out).
- [ ] `setActiveLocationAccessor` exists and can be read by framework code without importing React context.
- [ ] Existing key/tier behavior still works (added beside, nothing removed); typecheck and lint clean; vitest passes in `apps/web`.

## Blocked by

- None (can start immediately).
