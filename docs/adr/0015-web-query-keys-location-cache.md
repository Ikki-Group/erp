# ADR-0015: Web Query-Key Convention & Location-Scoped Cache Partitioning

**Status:** Accepted
**Date:** 2026-09-17
**Depends on:** ADR-0007 (auth/iam — client-side location switching), ADR-0008 (Location as the operational unit).
**Scope:** `apps/web` data-fetching layer (TanStack Query + Router).

## Context

The web data-fetching layer (`defineQuery`/`defineMutation`/`defineResource` in `apps/web/src/lib/api/`) had three competing ways to build TanStack Query keys: a `createQueryKeys(feature, resource)` factory used by exactly one feature, `defineResource`'s own URL-anchored internal keys, and a hand-copied `{ lists, list, details, detail }` object re-declared in most feature `api.ts` files. Cross-feature invalidation was therefore fragile — there was no single key shape to target — which is why the location switcher resorted to a blanket `queryClient.invalidateQueries()` plus a hand-written "invalidate everything except `/auth/me`" predicate.

Separately, location-scoped data (POS orders/shifts, inventory stock, per-location menu) keyed its cache only by whatever `locationId` happened to sit in the query's filter params. One endpoint — POS `shift.active` — carried **no** `locationId` in its key at all (the server infers the active location from the session), so switching location could serve another location's cached active-shift. Consumers patched this with a manual `queryKey` override, duplicated per call site.

The active location is a client-side concern (ADR-0007): it lives in React context + `localStorage` and is sent per request. Framework-level code that builds query keys cannot read React context via hooks.

## Decision

### 1. One canonical query-key factory

`createResourceKeys(feature, resource, { locationScoped? })` is the single source of query keys. It produces a **structured tuple**:

```
plain:            [feature, resource, kind, params?]
location-scoped:  [feature, resource, { loc }, kind, params?]
```

`kind` is `'list'`/`'detail'`; `params` is the trailing filter/id object (normalised to `null` when absent). Because the shape is fixed and prefix-structured, `lists()` is a true prefix of every `list(params)`, so partial-match invalidation is unambiguous. `defineResource` consumes this factory; features that aren't plain CRUD compose their endpoints on the same factory's exported `keys`.

### 2. Location-scoped endpoints fold the active location into the key

An endpoint declared `locationScoped` folds the active `locationId` in as a `{ loc }` segment placed **before** `kind` (so `lists()`/`details()` prefixes stay per-location). This partitions the cache per location: location 1's list and location 2's list are distinct entries. Switching location is then a natural cache-miss that refetches the new location, while the previous location's entries stay cached for an instant switch-back. The `{ loc }` segment is a cache concern only — `locationId` is still sent as a server query param where the endpoint's contract requires it (folding the key is _additive_, not a replacement).

### 3. Framework reads the active location through a wired accessor

`getActiveLocationId()` / `setActiveLocationAccessor(() => number | null)` (mirroring the existing token-accessor pattern) let the key factory read the live active location with no React hook and no circular dependency. The location provider wires the accessor **synchronously during render** (guarded to run once), not in a mount effect: a child route can build a location-scoped key on the first commit — before a parent's mount effect would run — and must not read a `null` location then. `null` means the consolidated (all-locations) view, matching the server/provider convention.

### 4. Location switch relies on key partitioning, not blanket invalidation

Because location-scoped keys carry `{ loc }` and every other location-dependent query carries `locationId` in its key params, switching location changes those keys and refetches naturally on re-render. The switcher no longer calls `queryClient.invalidateQueries()` at all. Global reference data (roles, UoM, company, `/auth/me`) keeps its keys and is left untouched.

## Alternatives Considered

- **Keep the three key shapes, unify only behind `defineResource`.** Rejected: leaves the hand-rolled duplication and the fragile cross-feature invalidation in place.
- **Pass `locationId` explicitly to every location-scoped call.** Rejected: reintroduces the per-call boilerplate the redesign removes; the accessor confines the ambient coupling to one wired-once point (the same trade-off already accepted for the auth token).
- **Keep the blanket invalidate on switch.** Rejected: it refetched global reference data that doesn't change with location (loading flashes), and required a hand-written `/auth/me` exception. Per-location key partitioning is both cheaper and more correct.

## Consequences

- **Easier:** one key shape everywhere; prefix-based invalidation is obvious; per-location cache means instant switch-back and no cross-location bleed; the manual `shift.active` key override and the blanket-invalidate exception are both deleted.
- **Harder:** invalidation targets for location-scoped mutations must be **resolver functions** (`() => keys.lists()`), not precomputed keys, so the active `locationId` is read at mutation time rather than pinned at module load.
- **Migration state:** the canonical factory + `locationScoped` are proven on two pilots (`location`, POS `order`/`shift`). The remaining features still use the legacy hand-rolled `{ lists, list, details, detail }` objects and `createQueryKeys`; those shapes stay until each feature is migrated onto `createResourceKeys` in follow-up work. They are not dead code and are not removed by this decision.
