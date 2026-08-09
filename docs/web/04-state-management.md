# State Management

Auth context, location context, and the role of TanStack Query as server state manager.

## State Categories

| Category     | Tool                  | Scope                                      |
| ------------ | --------------------- | ------------------------------------------ |
| Server state | TanStack Query cache  | All data from API (lists, details, counts) |
| Auth state   | React Context         | Current user, permissions, isOwner         |
| Location     | React Context + URL   | Active location, location list             |
| UI state     | Component-local state | Form inputs, modals, toggles               |

There is no global store (no Zustand, no Redux). Server state lives in TanStack Query. Client state that spans components uses React Context. Everything else is local.

## Auth Context

### Shape

```ts
interface AuthUser {
  id: number
  username: string
  name: string
  email: string
}

interface AuthLocation {
  id: number
  code: string
  name: string
  type: 'store' | 'warehouse'
}

interface AuthState {
  user: AuthUser | null
  permissions: string[]
  isOwner: boolean
  locations: AuthLocation[]         // all locations user can access
  isAuthenticated: boolean
  isLoading: boolean                // true during initial /me check
}

interface AuthActions {
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>  // re-fetch /me
}

type AuthContextValue = AuthState & AuthActions
```

### Flow

```
App Mount
  → AuthProvider renders
  → calls GET /auth/me
  → if 200: populate user, permissions, locations → isAuthenticated = true
  → if 401: user = null → isAuthenticated = false → redirect to /login

Login
  → POST /auth/login (sets cookie)
  → response: { user, locations, activeLocationId }
  → populate auth context
  → navigate to dashboard

Logout
  → POST /auth/logout (clears cookie)
  → clear auth context
  → navigate to /login
```

### Permission Helpers

```ts
// Check single permission
function hasPermission(permission: string): boolean

// Check any of multiple permissions
function hasAnyPermission(permissions: string[]): boolean

// Owner bypass — owners have all permissions implicitly
// isOwner = true means skip permission checks
```

Usage in components:

```tsx
const { hasPermission, isOwner } = useAuth()

// Hide button if no permission
{(isOwner || hasPermission('material:create')) && (
  <Button onClick={openCreateForm}>Add Material</Button>
)}
```

## Location Context

### Shape

```ts
interface LocationState {
  activeLocation: AuthLocation | null   // null = "all locations" (consolidated)
  isConsolidated: boolean               // derived: activeLocation === null
}

interface LocationActions {
  switchLocation: (locationId: number | null) => Promise<void>
}

type LocationContextValue = LocationState & LocationActions
```

### Location Sources

The active location is determined from multiple sources with this priority:

```
1. URL query param (?loc=123)     ← highest (shareable link override)
2. Context state                  ← user's current selection
3. localStorage persisted value   ← survives page refresh
4. null (consolidated)            ← default fallback
```

### Switch Flow

```
User clicks location in switcher
  → setActiveLocation(locationId) ← instant UI update
  → await POST /auth/switch-location { locationId }
  → await queryClient.invalidateQueries() ← refetch all active queries
  → URL updated with ?loc=locationId (if location-sensitive page)
```

For "All locations":
```
User clicks "All (N)" in switcher
  → setActiveLocation(null) ← instant UI update
  → await POST /auth/switch-location { locationId: null }
  → await queryClient.invalidateQueries()
  → URL: ?loc param removed
```

### localStorage Persistence

```ts
const LOCATION_STORAGE_KEY = 'ikki:active-location-id'

// On switch: save to localStorage
localStorage.setItem(LOCATION_STORAGE_KEY, String(locationId ?? ''))

// On mount: read from localStorage (if no URL override)
const stored = localStorage.getItem(LOCATION_STORAGE_KEY)
```

### URL Sync (`?loc=` Query Param)

Only location-sensitive pages include the query param. Global pages (settings, UoM, suppliers) do not.

```tsx
// In a location-sensitive route:
import { useLocationParam } from '@/hooks/use-location-param'

function StockPage() {
  const { locationId } = useLocationParam()  // reads from URL or context
  // locationId is used for display, context drives the actual server scoping
}
```

The `useLocationParam` hook:
1. Reads `?loc=` from URL search params
2. If present, syncs to location context (override)
3. If absent, reads from context
4. Returns current effective `locationId`

### Consolidated View Scoping

When `activeLocation = null`:
- Server returns data from **all locations the user has access to** (not all system locations)
- User with 3 location assignments sees consolidated data for those 3 only
- Owner (global assignment) sees all locations
- UI shows a "location" column in tables to distinguish source

## TanStack Query as Server State

### Setup

```tsx
// router.tsx
import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,         // 1 minute
      gcTime: 1000 * 60 * 5,        // 5 minutes
      refetchOnWindowFocus: false,   // ERP — don't surprise users with refetches
      retry: 1,
    },
  },
})

export function getRouter() {
  return createRouter({
    routeTree,
    context: { queryClient },       // inject for route loaders
    defaultPreload: 'intent',
  })
}
```

### Router Context Type

```ts
// router.tsx
import type { QueryClient } from '@tanstack/react-query'

interface RouterContext {
  queryClient: QueryClient
}

// __root.tsx
export const Route = createRootRouteWithContext<RouterContext>()({
  // ...
})
```

### Data Prefetching in Routes

Route loaders use `queryClient.ensureQueryData()` from the router context:

```tsx
export const Route = createFileRoute('/_authenticated/master/locations')({
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(
      locationApi.list.queryOptions({ page: 1, limit: 20 })
    )
  },
  component: LocationsPage,
})
```

### Cache Invalidation After Location Switch

When the user switches location, ALL active queries refetch because the server now scopes to a different location:

```ts
async function switchLocation(locationId: number | null) {
  setActiveLocation(locationId)
  await authApi.switchLocation.fetch({ locationId })
  await queryClient.invalidateQueries()  // broad invalidation — everything refetches
}
```

This is intentional. A location switch is infrequent (a few times per session) and changes the entire data context.

## What NOT to Put in State

| Data                          | Where it lives           | Not in                |
| ----------------------------- | ------------------------ | --------------------- |
| List of materials             | TanStack Query cache     | React state           |
| Current form values           | TanStack Form / local    | Context               |
| Whether a modal is open       | Component `useState`     | Context               |
| Active location               | LocationContext          | TanStack Query        |
| User permissions              | AuthContext              | localStorage          |
| Pagination page number        | URL search params        | Component state       |
| Sort/filter state for tables  | URL search params        | Component state       |

Rule of thumb: if the data comes from the server, it belongs in TanStack Query. If it's a user preference that persists, it goes in context + localStorage. If it's transient UI state, keep it local.

---

**Next:** [05-routing.md](./05-routing.md) — TanStack Router setup, layout routes, and auth guards.
