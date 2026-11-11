# TanStack Router + Query auth-guard research

**Status: implemented.** All 5 recommendations below were applied — `session` freshness tier (`lib/api/freshness.ts` + `features/auth/api.ts`), the `beforeLoad`/`AuthProvider` division-of-labor comments, the redirect-back-after-login round trip (`_authenticated.tsx` ↔ `login.tsx`), and (beyond the original recommendations) an `AppBootScreen` pending state for cold boot plus a "Sesi berakhir" toast on forced logout. See `docs/web/05-routing.md` and `docs/web/04-state-management.md` for the resulting documented behavior.

Scope: when should `/auth/me` refetch, and what should `_authenticated.tsx`'s `beforeLoad` / `login.tsx`'s redirect-if-authenticated check actually do — reasoned from primary sources, against the installed versions (`@tanstack/react-router@1.170.23` pinned exactly at that patch per `bun.lock`; `@tanstack/react-query@5.101.4` pinned exactly at that patch per `bun.lock`) and the new DB-backed multi-device session revoke (ADR-0018).

## Sources consulted

- Router — [Authenticated Routes](https://tanstack.com/router/latest/docs/framework/react/guide/authenticated-routes)
- Router — [Data Loading](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading)
- Router — [Preloading](https://tanstack.com/router/latest/docs/framework/react/guide/preloading)
- Router — [External Data Loading](https://tanstack.com/router/latest/docs/framework/react/guide/external-data-loading)
- Router — [Router Context](https://tanstack.com/router/latest/docs/framework/react/guide/router-context)
- Router official example source (GitHub, `main` branch, `examples/react/authenticated-routes`):
  [`src/routes/_auth.tsx`](https://github.com/TanStack/router/blob/main/examples/react/authenticated-routes/src/routes/_auth.tsx),
  [`src/routes/login.tsx`](https://github.com/TanStack/router/blob/main/examples/react/authenticated-routes/src/routes/login.tsx),
  [`src/auth.tsx`](https://github.com/TanStack/router/blob/main/examples/react/authenticated-routes/src/auth.tsx)
- Query — [Prefetching & Router Integration](https://tanstack.com/query/v5/docs/framework/react/guides/prefetching)
- Query — [Important Defaults](https://tanstack.com/query/v5/docs/framework/react/guides/important-defaults)
- Query — [Window Focus Refetching](https://tanstack.com/query/v5/docs/framework/react/guides/window-focus-refetching)
- Query — [`QueryClient` API reference](https://tanstack.com/query/latest/docs/reference/QueryClient) (reflects a newer, not-yet-installed minor with `query()`/deprecation notices — cross-checked against actual installed behavior below)
- Query — [`EnsureQueryDataOptions` interface reference](https://tanstack.com/query/v5/docs/framework/react/reference/interfaces/EnsureQueryDataOptions)
- **Ground truth**: the actual installed `@tanstack/query-core@5.101.4` build, read directly —
  `https://unpkg.com/@tanstack/query-core@5.101.4/build/legacy/queryClient.js` (this is the exact code running in `apps/web`, not docs paraphrasing it)
- Codebase files read for context: `apps/web/src/router.tsx`, `routes/__root.tsx`, `routes/_authenticated.tsx`, `routes/login.tsx`, `providers/auth-provider.tsx`, `lib/tanstack-query.ts`, `lib/api/client.ts`, `lib/api/endpoint.ts`, `lib/api/freshness.ts`, `features/auth/api.ts`, `docs/adr/0016-web-error-boundary-policy.md`, `docs/adr/0018-session-storage-cache-with-db-source-of-truth.md`, `docs/web/04-state-management.md`, `docs/web/05-routing.md`

## Findings

### 1. `beforeLoad` execution semantics

`beforeLoad` runs on **every route match**, on every navigation, cold boot or client-side — it is not gated by `staleTime`/`gcTime`/`shouldReload`. Those options gate the `loader`'s **SWR cache of returned data**, a separate mechanism from `beforeLoad`.

> "The `beforeLoad` function runs in relative order to these other route loading functions: Route Matching (Top-Down) → ... → Route Loading (including Preloading) → `beforeLoad` → `route.onError` → Route Loading (Parallel) → ..." — [Authenticated Routes](https://tanstack.com/router/latest/docs/framework/react/guide/authenticated-routes)

> "Every time a URL/history update is detected, the router executes the following sequence: Route Matching → Route Pre-Loading (Serial) → `route.beforeLoad` → `route.onError` → ..." — [Data Loading](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading)

> "**It's important to know that the `beforeLoad` function for a route is called before any of its child routes' `beforeLoad` functions**. It is essentially a middleware function for the route and all of its children." — same page

`routeOptions.staleTime`/`shouldReload`/`gcTime` are documented entirely in terms of the **loader's returned data cache** ("the number of milliseconds that a route's data should be considered fresh when attempting to load"), not `beforeLoad`. `_authenticated.tsx` has no `loader`, only `beforeLoad` — so none of these router-level knobs apply to it at all. **Every navigation into (or across) `_authenticated/*` re-runs `_authenticated`'s `beforeLoad`**, full stop. What varies is only what happens *inside* that `beforeLoad` body — and that's entirely a function of how `ensureQueryData` behaves (see §3), not of any router option.

Cold boot vs. client-side navigation distinction: the router doesn't make this distinction — the *Query cache* does. On cold boot the `QueryClient` is empty, so `ensureQueryData` inside `beforeLoad` has no cached data and fetches. On a subsequent in-app navigation the `QueryClient` still holds the `/auth/me` entry from before, so — per §3 below — `ensureQueryData` returns it synchronously with **no staleness check at all**, unless `revalidateIfStale: true` is passed.

### 2. Official "Authenticated Routes" pattern

The guide's canonical recommendation, confirmed by the official example repo:

- Auth state lives in **React context** (a `useAuth()` hook backed by `AuthProvider`), not directly as router context — because `beforeLoad`/`loader` can't call hooks. The router's typed context (`createRootRouteWithContext<MyRouterContext>()`) is the bridge: the app injects the *result* of `useAuth()` into `<RouterProvider context={{ auth }} />` before render, then routes read `context.auth` in `beforeLoad`.
- `beforeLoad` on the layout route (`_auth.tsx` in the example, `_authenticated.tsx` here) checks `context.auth.isAuthenticated` and throws a `redirect`.
- The redirect carries the attempted destination as a search param for return-after-login (see §7).
- Auth check failures (network errors during a session-verification call) should be try/caught and still redirect to `/login`, using `isRedirect()` to avoid swallowing the redirect itself:

```tsx
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    try {
      const user = await verifySession()
      if (!user) throw redirect({ to: '/login', search: { redirect: location.href } })
      return { user }
    } catch (error) {
      if (isRedirect(error)) throw error
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
})
```
— [Authenticated Routes](https://tanstack.com/router/latest/docs/framework/react/guide/authenticated-routes)

Our `_authenticated.tsx` matches this shape closely (React context + `useAuth`, `beforeLoad` redirect on failure, `isRedirect`-equivalent manual check) — the gaps are the redirect search param (§7) and what "check" actually means given §3/§4.

### 3. `ensureQueryData` vs `fetchQuery` vs `prefetchQuery` — the crux

This is the most consequential finding and it's **not obvious from the prose docs** — it required reading the shipped source. Confirmed directly from the exact installed build (`@tanstack/query-core@5.101.4`, `build/legacy/queryClient.js`, unminified but function-renamed):

```js
ensureQueryData(options) {
  const defaultedOptions = this.defaultQueryOptions(options);
  const query = queryCache.build(this, defaultedOptions);
  const cachedData = query.state.data;
  if (cachedData === void 0) {
    return this.fetchQuery(options);          // no data at all → delegate to fetchQuery
  }
  if (options.revalidateIfStale && query.isStaleByTime(resolveStaleTime(defaultedOptions.staleTime, query))) {
    void this.prefetchQuery(defaultedOptions); // fire-and-forget background refresh
  }
  return Promise.resolve(cachedData);          // ALWAYS returns immediately if data exists
}

fetchQuery(options) {
  const defaultedOptions = this.defaultQueryOptions(options);
  if (defaultedOptions.retry === void 0) defaultedOptions.retry = false;
  const query = queryCache.build(this, defaultedOptions);
  return query.isStaleByTime(resolveStaleTime(defaultedOptions.staleTime, query))
    ? query.fetch(defaultedOptions)             // stale → await a real fetch
    : Promise.resolve(query.state.data);        // fresh → return cached data, no network call
}

prefetchQuery(options) {
  return this.fetchQuery(options).then(noop).catch(noop);   // fetchQuery, errors swallowed
}
```

**`ensureQueryData` does NOT respect `staleTime` for its own resolution.** It checks only "does *any* cached data exist" — if yes, it resolves with that data **synchronously, no matter how stale it is**, and does nothing else *unless* the caller opts in with `revalidateIfStale: true` (not set by default; `EnsureQueryDataOptions.revalidateIfStale` has no documented default, i.e. falsy/`undefined` — confirmed in the [interface reference](https://tanstack.com/query/v5/docs/framework/react/reference/interfaces/EnsureQueryDataOptions)). Even with `revalidateIfStale: true`, the stale data is still returned immediately — the revalidation is a detached background `prefetchQuery` call, not something the caller awaits.

**`fetchQuery` DOES respect `staleTime` on every call** — it re-checks `isStaleByTime` each time it's invoked, and blocks on a real network fetch whenever the cached data is stale (including "no data" case, since `isStaleByTime` is true when there's nothing cached).

This behavioral gap is confirmed as intentional in the newer (not-yet-installed) API docs, which frame the current `ensureQueryData`/`fetchQuery` split as being consolidated into a single `query({ ...options, staleTime })` method with an explicit `staleTime: 'static'` opt-in for "return cache regardless of staleness" behavior — i.e. what `ensureQueryData` does today is officially characterized as the `'static'` staleTime case, contrasted with the normal staleTime-respecting case:

> "This method replaces the deprecated `fetchQuery`, and — combined with `{ staleTime: 'static' }` — the deprecated `ensureQueryData`." — [`QueryClient#query` reference](https://tanstack.com/query/latest/docs/reference/QueryClient)

Practical consequence for `_authenticated.tsx`:

```ts
beforeLoad: async () => {
  const data = await queryClient.ensureQueryData(authMeQuery.queryOptions())
  ...
}
```

- **Cold boot** (fresh `QueryClient`, no cache entry): `cachedData === undefined` → falls into `fetchQuery` → no data → `isStaleByTime` true → real network call. ✅ Session is verified.
- **Every subsequent client-side navigation** into/within `_authenticated/*` for the rest of the SPA session: the cache entry from the first call still exists (unless evicted by `gcTime` or invalidated) → `ensureQueryData` returns the **same in-memory object instantly**, doing **zero staleness check and firing zero network request**, regardless of the `standard` tier's 3-minute `staleTime`. The `beforeLoad` call is a no-op after the first successful fetch, until something else (mount-based `useQuery` refetch, window-focus refetch, an explicit `invalidateQueries`, or `gcTime` eviction) touches the cache.

This is the direct answer to "does `ensureQueryData` respect `staleTime`, i.e. can it return stale cached data without a network call" — **yes, unconditionally**, unless `revalidateIfStale: true` is passed, and even then the return is still immediate/synchronous.

### 4. Router-level `staleTime` vs Query-level `staleTime` — no double-caching risk here, but only because of how the route is built

Router's own `routeOptions.staleTime`/`preloadStaleTime`/`gcTime` govern the **SWR cache for data returned from `route.loader`** — a completely separate cache from TanStack Query's, keyed by route match + `loaderDeps`, living inside the router instance. Docs are explicit that these two caching layers are meant to be reconciled by *disabling* the router's own layer when delegating to an external cache:

> "When integrating at the router level... you may want to override the default preloading and stale-while-revalidate logic of TanStack Router... To let an external cache make the freshness decision, set `routerOptions.defaultPreloadStaleTime` or `routeOptions.preloadStaleTime` to `0`." — [Preloading](https://tanstack.com/router/latest/docs/framework/react/guide/preloading)

> "As long as you are using the defaults, the only change you'll need to make is to set the `defaultPreloadStaleTime` option on the router to `0`" — [Data Loading](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading)

Our `router.tsx` already does exactly this (`defaultPreloadStaleTime: 0`), consistent with `docs/web/04-state-management.md`'s note "TanStack Query owns freshness." However, `_authenticated.tsx` has **no `loader` at all** — only `beforeLoad` — so `routeOptions.staleTime`/`gcTime`/`preloadStaleTime` don't apply to it regardless; there is nothing there for the router-level cache to hold. The footgun the docs warn about (double-caching between router-loader-cache and query-cache) doesn't materialize *for this specific route* because it was built with `beforeLoad`-only, not `loader`. It would matter if a `loader` were later added to `_authenticated.tsx` or a child route without also zeroing that route's `preloadStaleTime`/relying on the router-wide default.

### 5. Cold-boot-once vs. re-check-every-navigation pattern

There is no dedicated official guide contrasting "verify session once at boot" vs. "assume valid unless proven otherwise," but the pattern is the direct, load-bearing consequence of §3: because `ensureQueryData` only fetches when *no data exists*, the officially-demonstrated router+Query integration pattern (§2, §6 of [External Data Loading](https://tanstack.com/router/latest/docs/framework/react/guide/external-data-loading)) is **already** "verify once, then trust the cache until something else invalidates it" — that's not a workaround, it's what `ensureQueryData` was designed to do:

> "`loader: () => queryClient.ensureQueryData(postsQueryOptions)` ... Read the data from the cache and subscribe to updates" — [External Data Loading](https://tanstack.com/router/latest/docs/framework/react/guide/external-data-loading)

The mechanism that keeps that trust from becoming stale forever is **not** the `beforeLoad`/`loader` call itself — it's the *reactive* observers (`useQuery`/`useSuspenseQuery`) mounted in the tree, which *do* respect `staleTime`, `refetchOnMount`, `refetchOnWindowFocus`, `refetchOnReconnect` (§6), plus any explicit `invalidateQueries` from a mutation. `AuthProvider`'s own `useQuery(authMeQuery.queryOptions())` is exactly this reactive observer for `/auth/me` — it is what actually re-verifies the session in the background on window focus/reconnect, not `_authenticated.tsx`'s `beforeLoad`. That division of labor (guard = cheap "has this been checked at all" gate; reactive hook = actual freshness engine) is the correct reading of the officially-demonstrated pattern, and is *already* how this codebase is structured — it just isn't documented as intentional anywhere, and the exact behavior of `ensureQueryData` (§3) is the load-bearing but undocumented detail that makes it work this way.

### 6. Window focus / reconnect revalidation — official guidance

> "If a user leaves your application and returns and the query data is stale, TanStack Query automatically requests fresh data for you in the background." — [Window Focus Refetching](https://tanstack.com/query/v5/docs/framework/react/guides/window-focus-refetching)

> "Stale queries are refetched automatically in the background when: New instances of the query mount / The window is refocused / The network is reconnected." — [Important Defaults](https://tanstack.com/query/v5/docs/framework/react/guides/important-defaults)

Critically, `refetchOnWindowFocus`/`refetchOnMount`/`refetchOnReconnect` only trigger a refetch **if the data is currently stale** (per `staleTime`) — they don't force a refetch of fresh data. So the *actual* trigger for catching an out-of-band session revoke is the **intersection** of "an active `useQuery` observer for `/auth/me` exists" (true here — `AuthProvider` always mounts one) **and** "the cached `/auth/me` data is stale by `staleTime`" **and** "a focus/reconnect/mount event fires." With the `standard` tier's 3-minute `staleTime`, a revoked session is invisible to the client for up to 3 minutes after the next focus/reconnect/mount event — or indefinitely if the tab is never refocused/reconnected/remounted in between. `important-defaults` also documents the `'static'` staleTime value (never refetch, blocks even manual invalidation) as explicitly the wrong tool for anything that can go stale from outside the client:

> "Use `'static'` for data that cannot change while the app is running: feature flags fetched at boot, user permissions loaded at login, static reference tables." — [Important Defaults](https://tanstack.com/query/v5/docs/framework/react/guides/important-defaults)

`/auth/me`'s session-validity portion is explicitly *not* this category post-ADR-0018 (it can now be invalidated by another device/tab or a future admin action), even though the user/permissions payload itself is comparatively static.

There is no official guidance recommending `refetchInterval` specifically for "revoked elsewhere" scenarios — polling is discussed generically ([Polling](https://tanstack.com/query/v5/docs/framework/react/guides/polling)) as a `refetchInterval` option independent of `staleTime`, useful when data can go stale for reasons the client can't observe via focus/reconnect (exactly this case, if focus/reconnect cadence isn't tight enough).

### 7. Redirect-after-login pattern

Confirmed both in docs and in the official example's actual source:

**Docs:**
```tsx
beforeLoad: async ({ location }) => {
  if (!isAuthenticated()) {
    throw redirect({
      to: '/login',
      search: {
        // Use the current location to power a redirect after login
        // (Do not use `router.state.resolvedLocation` as it can
        // potentially lag behind the actual current location)
        redirect: location.href,
      },
    })
  }
}
```
— [Authenticated Routes](https://tanstack.com/router/latest/docs/framework/react/guide/authenticated-routes)

**Official example** (`examples/react/authenticated-routes`), both sides of the round-trip:

```tsx
// routes/_auth.tsx (the protected-layout guard)
beforeLoad: ({ context, location }) => {
  if (!context.auth.isAuthenticated) {
    throw redirect({ to: '/login', search: { redirect: location.href } })
  }
}
```

```tsx
// routes/login.tsx
export const Route = createFileRoute('/login')({
  validateSearch: z.object({ redirect: z.string().optional().catch('') }),
  beforeLoad: ({ context, search }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: search.redirect || fallback })   // already-logged-in → bounce, honoring `redirect`
    }
  },
  component: LoginComponent,
})

// on submit:
await auth.login(username)
await router.invalidate()
await navigate({ to: search.redirect || fallback })          // after login → go back to intended page
```
— [`login.tsx`](https://github.com/TanStack/router/blob/main/examples/react/authenticated-routes/src/routes/login.tsx)

Two things this pattern does that ours doesn't:
1. The redirect *to* `/login` carries `search: { redirect: location.href }`.
2. **Both** the "already authenticated, bounce off `/login`" path and the "just logged in" path read that same `search.redirect` and navigate back to it (falling back to a default route if absent) — it's a matched pair, not just a one-way capture.

## Answering the user's two questions directly

### "Pengkondisian kapan harus refresh data user" (when `/auth/me` should refetch)

| Trigger | Should it refetch `/auth/me`? | Mechanism | Reasoning |
|---|---|---|---|
| Cold boot (app mount, no cache) | Yes, always | `ensureQueryData` in `beforeLoad` falls through to `fetchQuery` when no data exists (§3) | The only point where the router-level guard itself forces a network call — this is the one moment "check session on first load" is actually enforced by `beforeLoad`. |
| Client-side navigation across `_authenticated/*` routes, cache still warm | No (by default) | `ensureQueryData` returns cached data synchronously, no staleness check (§3) | This is *load-bearing*, not a bug: re-verifying session on every route match would mean a network round-trip per navigation. The gap is covered by the reactive `useQuery` in `AuthProvider`, not by `beforeLoad`. |
| Tab/window regains focus | Yes, if stale by `staleTime` | `refetchOnWindowFocus: true` (global default, inherited by `authMeQuery`) acting on `AuthProvider`'s `useQuery` (§6) | This is the realistic first line of defense for the multi-device-revoke scenario — but only fires if the cached data is *already stale*, i.e. only after `staleTime` has elapsed since the last fetch. |
| Network reconnect | Yes, if stale by `staleTime` | `refetchOnReconnect` (Query default `true` unless `networkMode: 'always'`) | Same caveat as focus: gated by `staleTime`. |
| New mount of a `useQuery(authMeQuery...)` observer | Yes, if stale by `staleTime` | `refetchOnMount: true` (global default) | Not very relevant here since `AuthProvider` mounts once for the app's lifetime. |
| After `authLoginMutation` / `authLogoutMutation` | Yes, unconditionally | `invalidates: [[endpoint.auth.me]]` already wired in `features/auth/api.ts`, plus `AuthProvider.login` explicitly calls `invalidateQueries` | Already correct — no change needed. |
| Periodic polling | Not currently, and not free | Would need `refetchInterval` on `authMeQuery` | No official guidance mandates this; it trades an idle network call every N seconds against catching a revoke without requiring focus/reconnect. Reasonable only if "revoked-elsewhere-while-tab-stays-focused-and-online" is a real product requirement (e.g. an admin "force logout" button that should take effect within seconds, not on the next tab-switch). |

Recommended `authMeQuery`-specific settings, reasoned from the table above and ADR-0018's threat model (a session can now be invalidated **out-of-band**, so the client's picture of "am I still logged in" can go stale for reasons entirely outside its own request/response cycle — this is precisely the case [Important Defaults](https://tanstack.com/query/v5/docs/framework/react/guides/important-defaults) says `staleTime: 'static'`/long `staleTime` is wrong for):

- **`staleTime`: materially shorter than the inherited `standard` tier's 3 minutes.** The 3-minute default was tuned for ordinary list/detail data, not "is my session still valid." Something in the 30s–60s range balances "focus/reconnect actually catches a revoke soon" against "don't hit `/auth/me` on every tab-focus flicker." This directly trades off against how urgently a revoked session must be noticed — tighten further (or add polling) if "force logout should take effect within seconds" becomes a real requirement.
- **`refetchOnWindowFocus: true`** — already the global default; keep it. It's the primary mechanism that would catch a multi-device revoke in practice, per §6.
- **`refetchOnReconnect`** — already defaults to `true` (Query default, off only when `networkMode: 'always'`, which nothing here sets); no action needed, but worth keeping in mind since ADR-0018's revoke scenario ("another tab/device") is at least as likely to be discovered on reconnect as on focus.
- **`refetchInterval`: not by default** — only add it if a product requirement emerges for near-real-time revoke detection while a tab stays focused and online without any interaction (the `volatile` tier's 30s poll pattern in `freshness.ts` is the template to copy if so).
- **`gcTime`**: the `standard` tier's 5 minutes is fine as-is — it only controls how long an *inactive* (no observers) cache entry survives, and `AuthProvider`'s `useQuery` keeps an active observer for the app's entire lifetime, so this never actually triggers eviction while the app is open.

### "Pengecekan session saat first load" (session check on first load)

**Cold boot:** `_authenticated.tsx`'s current `ensureQueryData(authMeQuery.queryOptions())` call is **already correct** for this case — per §3, an empty cache forces `ensureQueryData` to delegate to `fetchQuery`, which unconditionally fetches. No gap here.

**Subsequent navigations (the actual gap):** the call is effectively inert after the first success, per §3 — it's not "wrong," it's *doing exactly what `ensureQueryData` is documented to do*, but the code as written reads as if it were re-verifying the session on every route match. It should either:
- be commented to make explicit that it's a "has this ever been checked" gate, not a "check it now" call, and/or
- pass `revalidateIfStale: true` if it's actually desirable for `beforeLoad` itself (not just the mounted `useQuery`) to kick off a background revalidation once `staleTime` has elapsed — noting per §3 that even with this flag, `beforeLoad` still resolves synchronously with the (possibly stale) cached data; it does not block navigation on the revalidation, and does not by itself redirect if the revalidation turns up a 401 (that still routes through the global `onAuthError` handler in `lib/tanstack-query.ts`).

**`login.tsx`'s "already authenticated → bounce to `/`" check:** structurally matches the official example's `beforeLoad` shape (check auth, `redirect` if true) but has a real gap: it always redirects to `/`, discarding wherever `_authenticated.tsx` intended to send the user in the first place. Per §7, the official pattern has both routes read the *same* `search.redirect` — ours only ever writes it into nothing, since `_authenticated.tsx` doesn't set it either. See recommendation (d) below.

## Recommendations for this codebase

Not implemented — for a human/future task to act on.

1. **`apps/web/src/routes/_authenticated.tsx`** — no functional change needed for the cold-boot case, but add a short comment above the `ensureQueryData` call explaining that it is a "has-this-been-checked-at-all" gate, not a per-navigation session re-verification, and that live revalidation is `AuthProvider`'s job. This is purely to prevent a future reader/AI agent from "fixing" it into something that fetches on every navigation, not realizing that's what it already effectively avoids doing.

2. **(a) `AuthProvider`'s `useQuery(authMeQuery...)` vs `_authenticated.tsx`'s `ensureQueryData(authMeQuery...)` — do they conflict?** No — they're complementary, not duplicative, once §3/§5 are understood: `ensureQueryData` in `beforeLoad` is the one-time "has this been fetched at all" gate (forces the cold-boot fetch, no-ops afterward); `AuthProvider`'s `useQuery` is the long-lived reactive observer that actually drives `staleTime`-gated refetch-on-focus/reconnect/mount and exposes `user`/`permissions`/etc. to components. Both read the *same* query key/cache entry by design, so there's exactly one network round-trip on boot, not two. No change needed here beyond the comment in (1) — but this non-obviousness is worth flagging explicitly since it's easy to misread as redundant.

3. **(b) `authMeQuery` should get its own freshness tier/`staleTime`, distinct from `standard`'s 3 minutes.** Currently `features/auth/api.ts`'s `authMeQuery` passes no `tier` to `defineQuery`, so it silently inherits `standard` (3 min stale / 5 min gc) from `lib/api/endpoint.ts`. Per the decision table above, session-validity data now has a different risk profile than ordinary reference/list data (ADR-0018's out-of-band revoke). Concretely: either add a new tier (e.g. `session`, ~30–60s stale) to `lib/api/freshness.ts` and opt `authMeQuery` into it, or pass an explicit `queryOptions` override with a shorter `staleTime` directly on `authMeQuery`'s definition. Given ADR-0016 (`docs/adr/0016-web-error-boundary-policy.md`) already established "named tiers, not raw numbers" as the house convention, a new tier is more consistent than a one-off override.

4. **(c) Is `refetchOnWindowFocus` (already on globally) sufficient for the multi-device-revoke scenario, or is something more needed?** It's the *right primary mechanism* per §6, but it's gated by `staleTime` — with the current 3-minute `standard` tier, a revoke is invisible for up to 3 minutes after the next focus/reconnect, or indefinitely if the tab never loses/regains focus or reconnects. Shortening `authMeQuery`'s `staleTime` (recommendation 3) directly tightens this window and is the lowest-effort fix. Whether to go further (a `refetchInterval` poll, or a dedicated lightweight `/auth/session-check` endpoint) is a product decision, not something the TanStack docs mandate — reserve it for if/when "force logout must take effect within seconds regardless of focus/reconnect" becomes an actual requirement; nothing in ADR-0018 suggests that urgency today (it frames revoke as "immediate at the server," not as requiring instant client-side reflection).

5. **(d) Redirect-back-after-login gap.** Per §7, adopt the matched-pair pattern from the official example:
   - `_authenticated.tsx`'s `beforeLoad`: `throw redirect({ to: '/login', search: { redirect: location.href } })` instead of the current unparameterized redirect.
   - `login.tsx`: add `validateSearch` for a `redirect` string param; in the "already authenticated" `beforeLoad` branch, redirect to `search.redirect` (falling back to `/`) instead of always `/`; in `handleSubmit`'s post-login `navigate()`, also target `search.redirect ?? '/'` instead of the hardcoded `'/'`.
   - This is a self-contained change with no interaction with the freshness/staleness recommendations above.
