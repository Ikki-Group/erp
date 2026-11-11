# ADR-0016: Web Error-Boundary & Query Freshness Policy

**Status:** Accepted
**Date:** 2026-09-17
**Depends on:** ADR-0015 (web query-key convention).
**Scope:** `apps/web` data-fetching layer (TanStack Query + Router).

## Context

Two data-fetching UX policies were undecided in code. `throwOnError` on the query client was hard-coded to `false` with the intended logic left commented out — an abandoned decision, so _no_ query error ever reached a boundary and every screen had to handle every failure inline. And every query, from a near-static location list to a live POS active-shift check, shared one global 3-minute `staleTime`; nothing tuned freshness to how volatile the data actually is.

Both are cross-cutting: an inconsistent answer means each feature invents its own error handling and its own (or no) freshness choice.

## Decision

### 1. Error boundary: throw network errors, keep everything else inline

`throwOnError` returns `true` only for **network-level** failures — an `ApiError` with no HTTP response (`isNetworkError`, i.e. `status === undefined`). Those throw to the nearest route `errorComponent`, which renders a retryable page-level error (retry re-runs the loader). Recoverable errors that _did_ get a response (4xx/5xx) return `false` and stay in the query's `error` state for precise, in-context handling via `ApiError.friendlyMessage`.

Rationale: a page whose data never reached the server has nothing meaningful to render inline, so a route-level boundary with a retry is the honest response; a validation or not-found error is best explained where the affected component is. Session expiry (401/403) is handled separately by the existing single-fire global redirect and is not part of the throw policy. Mutations keep their errors inline (a failed user action wants an inline toast, not a full-page boundary); the one case that must be centralised — session expiry — is already covered by the global `onError` handler.

### 2. Loader-backed routes use Suspense

Routes that prefetch via a `loader` (`ensureQueryData`) read with `useSuspenseQuery`, so the component renders against guaranteed-present data with no inline `isLoading` branch. Loading and error move to the route boundary: `pendingComponent` (a page skeleton) and `errorComponent` (the retryable error above). A single `suspenseOptions()` helper bridges TanStack Query's nominally-distinct `UseQueryOptions`/`UseSuspenseQueryOptions` so the same endpoint `queryOptions()` feeds both the loader and the hook.

### 3. Freshness tiers, not raw numbers

Every query opts into a **named freshness tier** rather than a raw `staleTime`. The tier maps to concrete `staleTime`/`gcTime`/`refetchInterval` in one place:

| Tier       | Meaning                                                                          | staleTime                          |
| ---------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| `static`   | Rarely-changing reference data (locations, UoM, roles, payment methods, company) | long (10 min)                      |
| `standard` | Default for ordinary lists/details                                               | 3 min (the prior app-wide default) |
| `volatile` | Live operational data (POS active shift, order detail, stock balance)            | near-zero (10 s) + poll            |
| `realtime` | Always refetch                                                                   | 0                                  |

Rationale: a raw number per endpoint drifts into a dozen unexplained magic numbers; a named tier makes "how fresh must this be?" an explicit, greppable, reviewable decision, consistent across features and changeable in one edit.

## Alternatives Considered

- **Throw nothing (keep the de-facto `return false`).** Rejected: leaves the dead commented branch and forces every screen to render some inline treatment even for a dead connection.
- **Throw everything to a boundary.** Rejected: a 404 or a validation error is better handled in context than as a full-page error.
- **Raw per-endpoint `staleTime` numbers.** Rejected: unreviewable magic-number drift; named tiers keep intent visible.

## Consequences

- **Easier:** consistent, greppable freshness intent; loader-backed pages render guaranteed data with no `isLoading` boilerplate; dead-connection failures get a uniform retryable boundary.
- **Harder / constraint:** loader-backed components must pair `ensureQueryData` (plain options) with `useSuspenseQuery(suspenseOptions(...))`; the `suspenseOptions` cast erases the type-level ban on suspense-hostile options (`enabled`, `placeholderData`), so callers must not thread those through it.
- **Proven on:** the `location` and POS `order`/`shift` pilots; the freshness tiers are applied wherever an endpoint is touched, and remaining features adopt a tier as they are migrated.
