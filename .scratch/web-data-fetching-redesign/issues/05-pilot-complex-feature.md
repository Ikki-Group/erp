## Parent

#40 — Web data-fetching layer redesign (TanStack Query + Router)

## What to build

Fully migrate one hand-rolled multi-endpoint feature (POS order **or** inventory receiving — chosen by which best exercises `locationScoped`) onto the redesigned primitives as the **complex pilot**, proving composition + location-scoped caching + the `volatile` tier together:

- The resource's CRUD half comes from `defineResource`; its extra endpoints (`void`/`ship`/`confirm`/`active`/…) are composed alongside via object spread, sharing the resource's exported keys — no more hand-rolled CRUD duplication.
- Location-dependent queries are marked `locationScoped`: their cache partitions per `locationId` and switching location refetches only them.
- Live operational queries use the `volatile` tier.
- The manual `locationId` key-override in the POS new-order route and the hand-written invalidate-except-`/auth/me` predicate in the location provider are both deleted; location-switch invalidation now targets only location-scoped queries.

## Acceptance criteria

- [ ] The pilot feature's CRUD comes from `defineResource` and its extra endpoints are composed with shared keys (no re-implemented CRUD).
- [ ] Location-scoped queries partition cache per location: switching to a location and back shows cached data instantly; switching refetches only location-scoped queries, leaving global reference data untouched.
- [ ] The POS new-order manual key override and the location-provider `predicate` exception are removed.
- [ ] The blanket `queryClient.invalidateQueries()` on switch is replaced by scoped invalidation.
- [ ] The feature's `apps/e2e` spec is updated to describe the redesigned flow.
- [ ] Typecheck and lint clean; `apps/web` vitest passes.

## Blocked by

- #42 (Endpoint factory redesign)
- #43 (`useServerTable` → URL search-param state)
