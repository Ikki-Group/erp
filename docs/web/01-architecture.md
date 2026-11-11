# Architecture

High-level architecture and technology decisions for the Ikki ERP web frontend.

> **Status:** Implemented. The app is a client-side React SPA (Vite + TanStack Router + TanStack Query + shadcn/ReUI). Data-fetching follows the redesign in ADR-0015/0016 (loader prefetch + Suspense, freshness tiers, location-scoped cache).

## Tech Stack

| Layer         | Choice                                                                               |
| ------------- | ------------------------------------------------------------------------------------ |
| Framework     | React 19 (client SPA — **not** TanStack Start / SSR)                                 |
| Bundler       | Vite 8                                                                               |
| Routing       | TanStack Router (file-based, code-splitting, `RouterProvider` mounted in `main.tsx`) |
| Data Fetching | TanStack Query                                                                       |
| Forms         | TanStack Form + Zod adapter                                                          |
| Tables        | TanStack Table + ReUI DataGrid                                                       |
| HTTP Client   | Native fetch wrapper                                                                 |
| Styling       | Tailwind CSS 4                                                                       |
| Components    | ReUI (primary) + shadcn/base-ui (fallback)                                           |
| Icons         | Lucide React                                                                         |
| Validation    | Zod 4 (same version as server)                                                       |
| Linting       | oxlint                                                                               |
| Formatting    | oxfmt                                                                                |
| Testing       | Vitest + Testing Library                                                             |

## Layer Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      Route Layer                         │
│  File-based routes (TanStack Router)                     │
│  Responsible for: layout, auth guards, data prefetching  │
└────────────────────────┬────────────────────────────────┘
                         │ imports
┌────────────────────────▼────────────────────────────────┐
│                    Feature Layer                          │
│  src/features/{module}/                                   │
│  Responsible for: page components, module-specific UI     │
└────────────────────────┬────────────────────────────────┘
                         │ uses
┌────────────────────────▼────────────────────────────────┐
│                     API Layer                             │
│  defineQuery / defineMutation / defineResource            │
│  Responsible for: HTTP calls, Zod validation, cache keys  │
└────────────────────────┬────────────────────────────────┘
                         │ calls
┌────────────────────────▼────────────────────────────────┐
│                   HTTP Layer                              │
│  Native fetch wrapper (src/lib/api/)                      │
│  Responsible for: base URL, credentials, error normalize  │
└────────────────────────┬────────────────────────────────┘
                         │
                    ── network ──
                         │
┌────────────────────────▼────────────────────────────────┐
│              Server (apps/server — Elysia)                │
└─────────────────────────────────────────────────────────┘
```

## Key Architectural Decisions

### Authentication: Session Cookies

The server sets an HttpOnly session cookie on login. The frontend includes it automatically via `credentials: 'include'` on every request. No token management in frontend code.

- `POST /auth/login` → server sets cookie, returns user + locations
- `GET /auth/me` → returns current user, active location, permissions
- `POST /auth/switch-location` → updates session's active location
- `POST /auth/logout` → clears cookie

### Location Scoping: Server-Side via Session

Location is the operational unit. The server tracks the active location in the session. The frontend:

1. Stores active location in React Context (+ localStorage for persistence across refreshes).
2. Calls `POST /auth/switch-location` on switch (awaited).
3. Invalidates all active queries after switch completes.
4. Passes `?loc=` query param in URL for shareable links (location-sensitive pages only).

`activeLocationId: null` means "all user's accessible locations" — server filters by the user's assignments, not all system locations.

### Data Fetching: TanStack Query as Server State

All server state lives in TanStack Query cache. No duplication in local state. See ADR-0015 (query keys + location-scoped cache) and ADR-0016 (error boundary + freshness tiers) for the normative decisions.

- Query client injected into router context; route `loader`s prefetch via `context.queryClient.ensureQueryData(endpoint.queryOptions(args))`, and components read the same options with `useSuspenseQuery` (via `suspenseOptions()`), so loading/error live at the route boundary (`pendingComponent`/`errorComponent`).
- `QueryClientProvider` wraps the component tree.
- Mutations declare `invalidates` (auto-invalidation on success). Freshness is a **named tier** (`static`/`standard`/`volatile`/`realtime`), not a raw `staleTime`.

### API Layer

Core abstractions in `src/lib/api/`:

- `defineQuery` — typed query endpoint; accepts a `tier` and a `locationScoped` flag.
- `defineMutation` — typed mutation with declarative (resolver-based) invalidation.
- `defineResource` — CRUD sugar (list/detail/create/update/remove); non-CRUD resources compose extra endpoints on the resource's exported `keys`.
- `createResourceKeys(feature, resource, { locationScoped })` — the single canonical query-key factory, producing structured `[feature, resource, kind, params]` keys (with a `{ loc }` segment when location-scoped).

> Migration state: the two pilots (`location`, POS `order`/`shift`) run on `createResourceKeys` + `locationScoped`. The remaining features still use their pre-redesign hand-rolled key objects (and `createQueryKeys`); those are migrated onto the canonical factory in follow-up work and are not dead code.

### Component Strategy: ReUI Primary

ReUI registry is the primary source for complex components (data grids, forms, navigation). Shadcn/base-ui primitives (already installed: button, dialog, table, sidebar, etc.) serve as the fallback for anything ReUI doesn't cover.

### Build Order (Phase 1)

```
Auth → App Shell → Master Data → Menu → Inventory → POS
```

Matches server layer dependencies: operations depend on master data existing in the UI first.

## Key Libraries (installed)

`@tanstack/react-query` + devtools (server state), `zod` v4 (validation/DTOs/form schemas), `@tanstack/react-form` (forms, with the in-repo Zod bridge in `lib/form`), `@tanstack/react-table` + ReUI DataGrid (tables), `@tanstack/react-router` + devtools (routing).

## Router wiring (current)

- `main.tsx` mounts `<RouterProvider router={getRouter()} />` — a plain client SPA render, **not** TanStack Start. There is no `shellComponent` and no SSR.
- `getRouter()` (`router.tsx`) injects the `queryClient` into router context, so route `loader`s reach it as `context.queryClient`. `defaultPreload: 'intent'`, `defaultPreloadStaleTime: 0` (TanStack Query owns freshness).
- `__root.tsx` uses `component` (the SPA `RootComponent`) and wraps the tree in `QueryClientProvider` + the app providers.

## What the Frontend Does NOT Own

- Business logic validation — server enforces all rules
- Permission enforcement — server rejects unauthorized requests
- Data transformation — server returns ready-to-display DTOs
- Location access control — server scopes by session

The frontend's job: present data, collect input, navigate, provide responsive feedback.

---

**Next:** [02-project-structure.md](./02-project-structure.md) — Folder conventions and feature module organization.
