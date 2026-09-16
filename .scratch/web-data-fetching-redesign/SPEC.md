# Spec: Web Data-Fetching Layer Redesign (TanStack Query + Router)

`ready-for-agent` · GitHub Issues (`Ikki-Group/erp`) · synthesized from a `/grill-with-docs` session over the current `apps/web` API layer.

> Posture: **clean code first, breaking changes allowed, no backward-compatibility obligation.** The existing `defineQuery`/`defineMutation`/`defineResource` core is sound in principle (Zod-validated types end-to-end, tagged query keys, no `any` escapes), but the surrounding conventions have drifted and the public API carries friction that should be removed rather than wrapped. Domain vocabulary: root `CONTEXT.md`. New web-layer terms are added to `CONTEXT.md` as part of this effort; two web-layer ADRs (`0015+`) are filed in the existing root `docs/adr/`.

## Problem Statement

As a developer working in `apps/web`, I cannot reason about how data is fetched, cached, or invalidated with confidence, because the data-fetching layer has drifted in six concrete ways:

1. **Query keys have three competing shapes.** A `createQueryKeys(feature, resource)` factory exists but is used in exactly one feature; `defineResource` builds its own URL-anchored keys internally; and 7+ feature files hand-copy an identical `{lists,list,details,detail}` object with zero code sharing. Cross-feature invalidation is therefore fragile and inconsistent.
2. **No route-level prefetching.** Every route fetches inside the component via `useQuery`; there are zero router `loader`s. Navigation shows a spinner that a loader could have avoided, and nested routes can waterfall.
3. **`defineResource` can't be extended.** Any resource needing more than plain CRUD (POS shift/order, inventory transfer/opname/receiving) abandons `defineResource` entirely and hand-rolls all five CRUD endpoints again, just to add `void`/`ship`/`confirm`.
4. **No per-query freshness control.** Every query — a near-static location list and a live POS active-shift check alike — shares one global 3-minute `staleTime`. Nothing overrides it.
5. **`undefined as never` friction.** No-argument endpoints force a `undefined as never` cast at 7 call sites because the `Args` type can't express "callable with zero params".
6. **Undecided error policy.** `throwOnError` is hardcoded `false` with the intended logic left commented out — a decision abandoned mid-flight.

On top of these, location switching does a blanket `invalidateQueries()` (nuke everything, including data that has nothing to do with location) plus a hand-written key-prefix exception, and one POS route manually rewrites a query key to fold in `locationId` because the endpoint layer doesn't do it. And the web architecture docs (`docs/web/03/04/05-*.md`) actively misdescribe the running app (they document TanStack Start with `shellComponent`, a 1-minute `staleTime`, and `refetchOnWindowFocus: false`; the real app is a plain React SPA with `RouterProvider`, a 3-minute `staleTime`, and `refetchOnWindowFocus: true`).

## Solution

Redesign the shared `lib/api` data-fetching primitives to the latest TanStack Query v5 + Router idioms, prioritizing a clean end state over preserving the current call-site shape. Then migrate two pilot features fully onto the new primitives to prove the pattern, leaving the remaining ~9–10 features as follow-up tickets that use the pilots as a template.

The end state:

- **One canonical query-key factory** is the only way keys are made. `defineResource` and every endpoint consume it; all duplicate hand-rolled key objects are deleted.
- **Router loaders prefetch data** via `ensureQueryData`; loader-backed components use `useSuspenseQuery` and read guaranteed data with no inline loading branch — loading and error move to the route's `pendingComponent`/`errorComponent`.
- **List state lives in the URL** (`validateSearch` + search params) so pagination, sort, and filters survive refresh, produce shareable links, and drive loader prefetching. `useServerTable` reads/writes URL search instead of local state.
- **`defineResource` stays a small CRUD factory**; resources needing extra endpoints compose them alongside the CRUD bundle via plain object spread.
- **Freshness is a named tier** (`static` / `standard` / `volatile` / `realtime`), mapped to concrete `staleTime`/`gcTime`/`refetchInterval` in one place; each endpoint opts into a tier.
- **No-arg endpoints are callable with zero arguments**; the `undefined as never` cast is deleted everywhere.
- **Error policy is explicit:** network errors (no response) throw to the nearest route `errorComponent`; recoverable errors (4xx/5xx) stay in `query.error` for inline handling. Auth-expiry (401/403) keeps its existing single-fire global redirect.
- **Location-scoped endpoints are declared as such** (`locationScoped: true`): the active `locationId` is folded into their query key (per-location cache partitioning; instant switch-back), and only they are invalidated on a location switch. Global reference data (roles, UoM, company, `/auth/me`) is left untouched. The framework reads the active `locationId` through a module-level accessor wired once at boot, mirroring the existing token accessor.
- **The web docs are corrected** to match the redesigned reality.

## User Stories

### Query keys & invalidation

1. As a developer, I want exactly one query-key factory used everywhere, so that I never have to guess which of three key shapes a feature uses.
2. As a developer, I want every feature's keys produced by that factory, so that deleting the hand-copied `{lists,list,details,detail}` objects removes a whole class of copy-paste drift.
3. As a developer, I want `defineResource` to build its keys from the same factory, so that a resource's list/detail keys and any hand-composed extra endpoints share one consistent shape.
4. As a developer, I want cross-feature invalidation to reference another feature's exported keys, so that "receiving affects stock" is expressed with `stockKeys.lists()` and not a bare URL string.
5. As a developer, I want query keys to be structurally predictable (`[feature, resource, kind, params]`), so that partial-match invalidation is obvious and safe.

### Router loaders & suspense

6. As a user, I want a list or detail page's data to be ready when the page renders, so that I don't stare at a spinner after the navigation already committed.
7. As a developer, I want route `loader`s to prefetch via `ensureQueryData` using the endpoint's own `queryOptions`, so that the loader and the component share one query definition.
8. As a developer, I want loader-backed components to use `useSuspenseQuery`, so that the component is a pure render of guaranteed-present data with no `isLoading` branch.
9. As a user, I want a page-level skeleton while a loader runs, so that loading feedback is consistent and lives at the route boundary.
10. As a user, I want a page-level error with a retry when a loader's fetch fails at the network level, so that a dead network doesn't render a confusing empty list.
11. As a developer, I want the router's `defaultPreloadStaleTime` left at `0`, so that Query's `staleTime` remains the single source of freshness truth.

### List state in the URL

12. As a user, I want pagination, sort, and search reflected in the URL, so that refreshing the page keeps my place.
13. As a user, I want to share a filtered list view by copying the URL, so that a colleague sees exactly what I see.
14. As a user, I want the browser back button to restore my previous list state, so that navigation feels native.
15. As a developer, I want `validateSearch` to parse list params with a Zod schema, so that malformed URLs fall back to sane defaults.
16. As a developer, I want `useServerTable` to read and write URL search params instead of local `useState`, so that the table state and the URL never diverge.

### `defineResource` composition

17. As a developer, I want `defineResource` to remain a focused CRUD factory, so that its behavior is easy to understand and doesn't grow a plugin system.
18. As a developer, I want to add extra endpoints (`void`, `ship`, `confirm`, `active`, …) by composing them with the CRUD bundle, so that a multi-endpoint resource stops re-implementing CRUD by hand.
19. As a developer, I want the extra endpoints to share the resource's exported keys, so that their invalidation targets stay consistent with the CRUD half.

### Freshness tiers

20. As a developer, I want to label each query with a freshness tier rather than a raw millisecond number, so that "how fresh does this need to be?" is an explicit, greppable decision.
21. As a developer, I want tiers mapped to concrete cache settings in one place, so that changing the meaning of "standard" is a one-line change.
22. As a user, I want near-static reference data (locations, UoM, roles) to not refetch constantly, so that the UI doesn't flash on every revisit.
23. As a user, I want live operational data (POS active shift, order detail, stock balance) to stay fresh, so that I'm not acting on stale numbers.

### No-arg ergonomics

24. As a developer, I want to call a no-argument endpoint's `queryOptions()`/`mutate()` with no arguments, so that `undefined as never` disappears from the codebase.

### Error policy

25. As a user, I want a network failure on a page load to show a retryable error boundary, so that I understand the app couldn't reach the server.
26. As a user, I want a validation or not-found error to render inline where the affected component is, so that I get a precise message in context.
27. As a user, I want an expired session to redirect me to login exactly once, so that parallel failing requests don't stack redirects.
28. As a developer, I want the error policy expressed as live code, not commented-out intent, so that the behavior is unambiguous.

### Location-scoped caching

29. As a developer, I want to declare an endpoint `locationScoped`, so that its location-dependence is a visible property rather than an implicit assumption.
30. As the system, I want a location-scoped endpoint's active `locationId` folded into its query key, so that each location's data caches separately and switching back is instant with no refetch.
31. As a user, I want switching location to refetch only location-dependent data, so that global reference data doesn't reload and flash for no reason.
32. As a developer, I want the framework to read the active `locationId` through one wired-once accessor, so that call sites stay clean and there's no circular dependency between the query layer and the location provider.
33. As a developer, I want the manual `locationId` key-override in the POS new-order route and the hand-written invalidate-except-`/auth/me` predicate both deleted, so that location correctness lives in one declared place.

### Pilots & docs

34. As a developer, I want the `location` feature fully migrated as the simple pilot, so that the CRUD-plus-loader-plus-URL-state path is proven end-to-end.
35. As a developer, I want one hand-rolled multi-endpoint feature (POS order or inventory receiving) fully migrated as the complex pilot, so that composition + `locationScoped` + tiers are proven together.
36. As a developer, I want the web architecture docs corrected to match the redesigned app, so that the next contributor reads truth, not the pre-redesign blueprint.
37. As a future maintainer, I want the query-key/location-cache convention and the error-boundary policy recorded as ADRs, so that these hard-to-reverse, cross-cutting decisions are explained.

## Implementation Decisions

### Primitives (`apps/web/src/lib/api/` + `lib/tanstack-query.ts`)

- **Canonical key factory.** One `createQueryKeys(feature, resource)` is the sole key source, producing a structured tuple (`[feature, resource, kind, params]`). `defineResource` consumes it internally; the three current shapes (its private URL-anchored keys, the unused factory usage pattern, and every hand-rolled per-feature object) are removed. Endpoints that need a key derive it from a resource's exported keys.
- **`Args` no-arg fix.** Retype the endpoint factories so an endpoint with neither `query` nor `body` schema exposes `queryOptions()`/`mutationOptions()` and `fetch()`/`mutate()` callable with zero arguments. Remove all `undefined as never` casts.
- **Freshness tiers.** A single module maps named tiers → concrete Query options:
  - `static` — long `staleTime` (reference data: locations, UoM, roles, payment methods, company).
  - `standard` — the default for ordinary lists/details.
  - `volatile` — near-zero `staleTime`, optional `refetchInterval` (POS active shift, order detail, stock balance).
  - `realtime` — always refetch.
    Each `defineQuery`/`defineResource` opts into a tier; the tier resolves to `staleTime`/`gcTime`/`refetchInterval` inside `queryOptions`. Concrete numbers are chosen during implementation and recorded in one place.
- **`defineResource` stays CRUD-only.** Extra endpoints are composed by the feature: the resource returns its CRUD bundle + exported `keys`, and the feature spreads it alongside hand-written `defineMutation`/`defineQuery` that reference those same keys. No config-callback plugin surface is added.
- **Error policy.** `throwOnError` returns `true` only for network-level errors (no HTTP response); 4xx/5xx return `false` and remain in `query.error`. The existing single-fire 401/403 global redirect is retained. The commented-out dead branch is removed.
- **Location-scoped endpoints.** `defineQuery`/`defineResource` accept a `locationScoped` marker. When set: (a) the active `locationId` is folded into the generated query key so caches partition per location; (b) the endpoint's keys are the precise target for location-switch invalidation. The active `locationId` is read via a new module-level accessor (e.g. `setActiveLocationAccessor(() => number | null)`), wired once at boot by the location provider — mirroring the existing `setTokenAccessor` in `client.ts`. No circular dependency; call sites unchanged.

### Router & routes (`router.tsx`, route files)

- Keep `defaultPreloadStaleTime: 0`; Query owns freshness.
- List routes: define a Zod `validateSearch` for pagination/sort/filter; the `loader` reads validated `search` and calls `context.queryClient.ensureQueryData(endpoint.queryOptions(search))`; the component uses `useSuspenseQuery` with the same `queryOptions`. `pendingComponent` renders the page skeleton; `errorComponent` renders a retryable page error.
- Detail routes: `loader` prefetches by `id` param; component uses `useSuspenseQuery`.
- `useServerTable` is refactored to source its state from (and write it back to) URL search params via the router, replacing the internal `useState` + `onStateChange` model.

### Location provider (`providers/location-provider.tsx`)

- On switch: wire the active `locationId` into the accessor, then invalidate only location-scoped queries (by their shared marker), not everything. Delete the blanket `invalidateQueries()` and the `predicate: key[0] !== authMeQuery…` exception.
- The POS new-order route's manual shift-key `locationId` override is removed once the endpoint folds it in automatically.

### Rollout

- **Pilot 1 — `location`** (already on `defineResource`; simplest). Proves: canonical keys, URL-state list, loader + `useSuspenseQuery`, tiers, error boundary.
- **Pilot 2 — one hand-rolled multi-endpoint feature** (POS order _or_ inventory receiving; chosen at implementation time by which best exercises `locationScoped`). Proves: `defineResource` composition with extra endpoints, `locationScoped` caching + scoped invalidation, `volatile` tier.
- Remaining ~9–10 features (`material`, `uom`, `supplier`, `payment-method`, `iam`, `menu`, `recipe`, remaining `inventory`/`pos`, `company`, `audit`) become follow-up tickets templated on the pilots. Not built in this effort.

### Docs & ADRs

- Correct `docs/web/01/03/04/05-*.md` to describe the actual stack (React SPA + `RouterProvider`, not TanStack Start), the real defaults, loaders/suspense, URL list-state, freshness tiers, and location-scoped caching.
- Add web-layer terms to root `CONTEXT.md`: **location-scoped endpoint**, **freshness tier**, **query-key factory**.
- File two ADRs (`0015`, `0016`) in root `docs/adr/`: (1) query-key convention + location-scoped cache partitioning; (2) error-boundary / `throwOnError` policy.

## Testing Decisions

- **What makes a good test:** assert observable behavior through the highest existing seam, not the internals being reshaped. Since backward compatibility is not required, tests are **updated where the observable contract intentionally changes** (e.g. list state moving into URL search params changes what the e2e spec navigates to and asserts) — the goal is that each pilot feature's tests describe the _new_ correct behavior, not that old assertions survive untouched.
- **Primary seam — `apps/e2e` Playwright specs** for the two pilot features (`locations.spec.ts` + the chosen complex pilot's spec). These exercise the full stack through the browser: list loads/paginates/searches, create/edit/delete, and (complex pilot) the multi-step action flow. Update these specs to assert the URL now reflects list state (search params present after paginate/search) and that a shared filtered URL reproduces the view. This is the acceptance gate for "the redesign didn't break the feature."
- **Secondary seam — `apps/web` vitest** for the pure new primitives: the freshness-tier → Query-options mapping (tier in → concrete `staleTime`/`gcTime`/`refetchInterval` out) and the `createQueryKeys` factory (deterministic, structurally-correct key arrays, including the location-scoped variant folding in `locationId`). Pure functions, no DB, fast — these run in this workspace today.
- **No new internal seams** inside `endpoint.ts`/`http.ts` fetch/validate plumbing — that would test implementation detail the e2e layer already covers through the real contract.
- **Prior art:** e2e specs live in `apps/e2e/tests/*.spec.ts` (auth fixture in `tests/fixtures/auth.fixture.ts`, seeded creds in `tests/helpers/test-data.ts`); web unit tests run via `bun run test` (vitest) in `apps/web`.
- **Known execution caveat:** the e2e suite requires an isolated test database via `apps/server/.env.test` (run through `scripts/test-e2e.sh`, which resets+seeds a `test-user` DB on ports 4100/3100). That file is not present in this workspace, so e2e is the _named_ acceptance gate but its execution depends on that env existing. The vitest unit seam has no such dependency.

## Out of Scope

- **Migrating the remaining ~9–10 features** — deliberately deferred to follow-up tickets templated on the two pilots.
- **Optimistic updates** — the refetch-after-mutate model is the correct default for an ERP where the server owns truth (per backend ADR-0006/0013). Noted as a deliberate non-goal; nothing in the redesign blocks adding it selectively per-interaction later.
- **Centralized mutation-error toasts** — orthogonal to data-fetching/caching; a per-call `try/catch → toast` stays for now. The one case that must be centralized (session expiry) is already covered by the global auth-error handler. Noted as a follow-up.
- **SSR / TanStack Start adoption** — the app stays a client SPA; this redesign explicitly corrects the docs that wrongly imply Start.
- **Server-side changes** — no `apps/server` contract or endpoint changes; create/update mutations continue to return `{ id }` and the UI relies on invalidation for fresh entities.

## Further Notes

- Posture confirmed in grilling: **clean code over backward compatibility.** Breaking the `.queryOptions()`/key call-site shapes is acceptable and expected; the `undefined as never` cast and the duplicate key objects should die, not be wrapped.
- The current `defineResource` create/update responses are `{ id }` only (not the full entity) — a hard constraint kept as-is; fresh data comes from invalidation + refetch, which the loader/suspense model handles cleanly.
- Suggested ticket order (blocking chain): (1) canonical key factory + freshness tiers + active-location accessor [foundation primitives] → (2) `Args` no-arg retype + error policy + `defineResource` composition shape + `locationScoped` wiring [endpoint-factory changes, depend on 1] → (3) `useServerTable` URL-state refactor [depends on router/search decisions] → (4) pilot `location` migration → (5) pilot complex-feature migration → (6) docs correction + ADRs + `CONTEXT.md` terms.
