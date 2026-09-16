## Parent

#40 — Web data-fetching layer redesign (TanStack Query + Router)

## What to build

Fully migrate the `location` feature onto the redesigned primitives as the **simple pilot**, proving the CRUD + loader + URL-state path end to end:

- `location` endpoints use canonical keys and the `static` freshness tier.
- The list route holds pagination/sort/search in the URL via `validateSearch`; the `loader` prefetches via `ensureQueryData(endpoint.queryOptions(search))`; the component uses `useSuspenseQuery` with the same `queryOptions` and has no inline `isLoading` branch.
- The detail route's `loader` prefetches by `id`; its component uses `useSuspenseQuery`.
- Loading and error move to the route boundary: `pendingComponent` (page skeleton) and `errorComponent` (retryable page error).

## Acceptance criteria

- [ ] `location` list and detail render through loader-prefetched `useSuspenseQuery` with no inline loading branch.
- [ ] Paginating/searching the location list updates the URL; a copied filtered URL reproduces the view; refresh preserves state.
- [ ] A network failure on load shows the route `errorComponent` with a retry; a recoverable error still surfaces inline where relevant.
- [ ] `apps/e2e/tests/locations.spec.ts` is updated to assert the new behavior (URL reflects list state after paginate/search) and describes the redesigned flow.
- [ ] Typecheck and lint clean; `apps/web` vitest passes.

## Blocked by

- #42 (Endpoint factory redesign)
- #43 (`useServerTable` → URL search-param state)
