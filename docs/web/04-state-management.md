# State Management

Auth context, location context, and the role of TanStack Query as server state manager.

> **Status:** Implemented. Auth/location providers and the TanStack Query client exist. Location-switch cache behavior follows ADR-0015 (per-location key partitioning, no blanket invalidation).

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
	locations: AuthLocation[] // all locations user can access
	isAuthenticated: boolean
	isLoading: boolean // true during initial /me check
}

interface AuthActions {
	login: (username: string, password: string) => Promise<void>
	logout: () => Promise<void>
	refreshAuth: () => Promise<void> // re-fetch /me
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
{
	;(isOwner || hasPermission('material:create')) && (
		<Button onClick={openCreateForm}>Add Material</Button>
	)
}
```

## Location Context

### Shape

```ts
interface LocationState {
	activeLocation: AuthLocation | null // null = "all locations" (consolidated)
	isConsolidated: boolean // derived: activeLocation === null
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
  → await POST /auth/switch-location { locationId }
  → setCurrentLocation(...) ← context re-renders every consumer
  → location-scoped keys now carry a different { loc } (and every other
    location-dependent query has a different locationId param) → the new
    location is a natural cache-miss that refetches; the previous location
    stays cached for instant switch-back. NO blanket invalidateQueries.
```

For "All locations":

```
User clicks "All (N)" in switcher
  → setCurrentLocation(null) ← consolidated view; { loc: null } partition
```

Global reference data (roles, UoM, company, `/auth/me`) keeps its keys and is untouched by a switch. See ADR-0015.

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
	const { locationId } = useLocationParam() // reads from URL or context
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

The `QueryClient` lives in `lib/tanstack-query.ts`. Per-query freshness is a **named tier** (ADR-0016), not a global number; the client defaults only set retry, refetch, and the `throwOnError` policy:

```ts
// lib/tanstack-query.ts (shape)
new QueryClient({
	defaultOptions: {
		queries: {
			retry: shouldRetry, // dev: none; prod: 3x, skip 4xx/auth
			refetchOnMount: true,
			refetchOnWindowFocus: true,
			staleTime: 3 * 60 * 1000, // the `standard` tier default; endpoints override via `tier`
			throwOnError: shouldThrowOnError, // true only for network errors → route errorComponent
		},
		mutations: { retry: shouldRetry, onError: handleGlobalError }, // single-fire 401/403 redirect
	},
})
```

`getRouter()` (`router.tsx`) injects `queryClient` into router context and sets `defaultPreload: 'intent'`, `defaultPreloadStaleTime: 0` (TanStack Query owns freshness). Endpoints opt into `static`/`standard`/`volatile`/`realtime` tiers; see ADR-0016.

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
			locationApi.list.queryOptions({ page: 1, limit: 20 }),
		)
	},
	component: LocationsPage,
})
```

### Cache Behavior After Location Switch (ADR-0015)

Switching location does **not** call `queryClient.invalidateQueries()`. Location-scoped endpoints fold the active `locationId` into their key (`{ loc }` segment), and every other location-dependent query carries `locationId` in its key params — so a switch changes those keys, making the new location a natural cache-miss that refetches on re-render, while the previous location's entries stay cached for an instant switch-back:

```ts
async function switchLocation(locationId: number | null) {
	if (locationId === null) {
		setCurrentLocation(null)
		return
	} // consolidated view
	const result = await switchMut.mutateAsync({ locationId })
	setCurrentLocation(result.data.activeLocation) // re-render → keys change → refetch
}
```

The framework reads the active location via `getActiveLocationId()`, wired once by `LocationProvider` through `setActiveLocationAccessor`. Global reference data keeps its keys and is untouched.

## What NOT to Put in State

| Data                         | Where it lives        | Not in          |
| ---------------------------- | --------------------- | --------------- |
| List of materials            | TanStack Query cache  | React state     |
| Current form values          | TanStack Form / local | Context         |
| Whether a modal is open      | Component `useState`  | Context         |
| Active location              | LocationContext       | TanStack Query  |
| User permissions             | AuthContext           | localStorage    |
| Pagination page number       | URL search params     | Component state |
| Sort/filter state for tables | URL search params     | Component state |

Rule of thumb: if the data comes from the server, it belongs in TanStack Query. If it's a user preference that persists, it goes in context + localStorage. If it's transient UI state, keep it local.

---

**Next:** [05-routing.md](./05-routing.md) — TanStack Router setup, layout routes, and auth guards.
