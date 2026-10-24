## Parent

#40 — Web data-fetching layer redesign (TanStack Query + Router)

## What to build

Redesign the endpoint factories (`defineQuery` / `defineMutation` / `defineResource`) onto the new primitives, prioritizing a clean API over the current shape:

- **No-arg ergonomics:** an endpoint with neither `query` nor `body` schema is callable with zero arguments (`queryOptions()`, `mutationOptions()`, `fetch()`, `mutate()`), eliminating the need for `undefined as never`.
- **`defineResource` stays CRUD-only:** it builds its keys from the canonical factory and returns the CRUD bundle + exported `keys`; extra endpoints are composed by the feature via plain object spread, not a config callback.
- **`locationScoped` marker:** when set on `defineQuery`/`defineResource`, the active `locationId` is folded into the query key (per-location cache partitioning) and the endpoint's keys become the precise target for location-switch invalidation.
- **Error policy as live code:** `throwOnError` returns `true` only for network-level errors (no HTTP response); 4xx/5xx return `false` and stay in `query.error`. The existing single-fire 401/403 global redirect is retained. The commented-out dead branch is removed.

The primitives are ready to consume; no feature is migrated in this ticket.

## Acceptance criteria

- [ ] A no-arg endpoint compiles and runs when called with zero arguments; the primitive change is verified against at least one existing no-arg endpoint (no `undefined as never` required).
- [ ] `defineResource` derives its keys from the canonical factory and returns `keys` for feature-side composition.
- [ ] An endpoint marked `locationScoped` produces a key that includes the active `locationId` (via the accessor) and is unit-tested.
- [ ] `throwOnError` returns `true` only for network errors and `false` for 4xx/5xx; the dead commented branch is gone.
- [ ] Existing features still compile against the redesigned factories (adjusting only what the breaking signature requires); typecheck and lint clean.

## Blocked by

- #41 (Foundation primitives: key factory + freshness tiers + active-location accessor)
