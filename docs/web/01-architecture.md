# Architecture

High-level architecture and technology decisions for the Ikki ERP web frontend.

> **Status:** Blueprint. The scaffold is in place (Vite + TanStack Start + shadcn primitives). The layers described below are the target — implement top-down following the build order at the end of this doc.

## Tech Stack

| Layer          | Choice                                       |
| -------------- | -------------------------------------------- |
| Framework      | React 19                                     |
| Meta-framework | TanStack Start (Vite-based, SSR-optional)    |
| Bundler        | Vite 8 (via TanStack Start)                  |
| Routing        | TanStack Router (file-based, code-splitting) |
| Data Fetching  | TanStack Query                               |
| Forms          | TanStack Form + Zod adapter                  |
| Tables         | TanStack Table + ReUI DataGrid               |
| HTTP Client    | Native fetch wrapper                         |
| Styling        | Tailwind CSS 4                               |
| Components     | ReUI (primary) + shadcn/base-ui (fallback)   |
| Icons          | Lucide React                                 |
| Validation     | Zod 4 (same version as server)               |
| Linting        | oxlint                                       |
| Formatting     | oxfmt                                        |
| Testing        | Vitest + Testing Library                     |

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

All server state lives in TanStack Query cache. No duplication in local state.

- Query client injected into router context for `beforeLoad` prefetching.
- `QueryClientProvider` wraps the component tree.
- Mutations use auto-invalidation pattern (awaited `invalidateQueries` on success).

### API Layer: Port of apiv2 (Archive)

The API layer is ported from `web-archive/src/lib/apiv2/`, with `ky` replaced by native fetch. Core abstractions:

- `defineQuery` — typed query endpoint with auto query keys
- `defineMutation` — typed mutation with declarative invalidation
- `defineResource` — CRUD sugar combining list/detail/create/update/remove

URL-anchored query keys enable safe cross-feature invalidation without circular imports.

### Component Strategy: ReUI Primary

ReUI registry is the primary source for complex components (data grids, forms, navigation). Shadcn/base-ui primitives (already installed: button, dialog, table, sidebar, etc.) serve as the fallback for anything ReUI doesn't cover.

### Build Order (Phase 1)

```
Auth → App Shell → Master Data → Menu → Inventory → POS
```

Matches server layer dependencies: operations depend on master data existing in the UI first.

## Dependencies to Install

The scaffold ships with React, TanStack Router/Start, Tailwind, and shadcn primitives. The following packages are required before implementing the layers above — install them as each layer is built:

| Package                          | Needed for                       | Install when      |
| -------------------------------- | -------------------------------- | ----------------- |
| `@tanstack/react-query`          | Server state, cache, prefetching | Auth + API layer  |
| `@tanstack/react-query-devtools` | Dev tooling                      | Same time         |
| `zod` (v4)                       | Validation, DTOs, form schemas   | API layer         |
| `@tanstack/react-form`           | Form management                  | Forms             |
| `@tanstack/zod-form-adapter`     | Zod ↔ TanStack Form bridge       | Forms             |
| `@tanstack/react-table`          | Data tables                      | Master Data pages |

## Scaffold vs. Target: Known Divergences

The current scaffold has a few differences from the target architecture above. Resolve these as you build:

1. **`main.tsx` creates its own router inline** — it should import `getRouter()` from `router.tsx` instead. The documented pattern in `router.tsx` (with `queryClient` context injection) is the target.
2. **`__root.tsx` uses `shellComponent`** (TanStack Start pattern) — this is correct for Start. The code examples in `05-routing.md` show `component` for simplicity but `shellComponent` is the Start-native equivalent.
3. **No `QueryClient` in router context yet** — add it when installing `@tanstack/react-query`. Route loaders depend on it.

## What the Frontend Does NOT Own

- Business logic validation — server enforces all rules
- Permission enforcement — server rejects unauthorized requests
- Data transformation — server returns ready-to-display DTOs
- Location access control — server scopes by session

The frontend's job: present data, collect input, navigate, provide responsive feedback.

---

**Next:** [02-project-structure.md](./02-project-structure.md) — Folder conventions and feature module organization.
