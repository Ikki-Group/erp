# Routing

TanStack Router setup, layout routes, authentication guards, and location query param conventions.

> **Status:** Implemented. Client-side SPA (`RouterProvider` in `main.tsx`), `_authenticated` layout with an auth guard, and — on the migrated pilots (`location`, POS) — `loader` prefetch + `useSuspenseQuery` with `pendingComponent`/`errorComponent`. See ADR-0016 for the loader/Suspense/error policy.

## Router Configuration

This is a plain client SPA: `__root.tsx` uses `component` (not `shellComponent` — there is no TanStack Start / SSR), and `main.tsx` mounts `<RouterProvider router={getRouter()} />`. `getRouter()` injects `QueryClient` into router context:

```tsx
// router.tsx
import { createRouter } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { routeTree } from './routeTree.gen'

const queryClient = new QueryClient({
	/* see 04-state-management.md */
})

export function getRouter() {
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreload: 'intent',
		defaultPreloadStaleTime: 0,
	})
}

declare module '@tanstack/react-router' {
	interface Register {
		router: ReturnType<typeof getRouter>
	}
}
```

Key settings:

- `context: { queryClient }` — available in every route's `beforeLoad`/`loader`.
- `defaultPreload: 'intent'` — prefetch on hover/focus for instant navigations.
- `scrollRestoration: true` — browser-native scroll position memory.

## Route Tree

```
routes/
├── __root.tsx                        ← providers, devtools, global head
├── login.tsx                         ← public
├── _authenticated.tsx                ← layout: auth guard + app shell
└── _authenticated/
    ├── index.tsx                     ← dashboard
    ├── settings/
    │   ├── company.tsx
    │   ├── users.tsx
    │   └── roles.tsx
    ├── master/
    │   ├── locations.tsx
    │   ├── materials.tsx
    │   ├── uom.tsx
    │   ├── suppliers.tsx
    │   ├── menu.tsx
    │   ├── recipes.tsx
    │   └── payment-methods.tsx
    ├── pos/
    │   ├── orders.tsx
    │   ├── tables.tsx
    │   ├── shifts.tsx
    │   └── vouchers.tsx
    └── inventory/
        ├── stock.tsx
        ├── transfers.tsx
        ├── receiving.tsx
        └── opname.tsx
```

## Root Route (`__root.tsx`)

Wraps the entire app with providers and global UI:

```tsx
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'

import { AuthProvider } from '@/providers/auth-provider'
import { LocationProvider } from '@/providers/location-provider'
import { TooltipProvider } from '@/components/ui/tooltip'

interface RouterContext {
	queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootComponent,
})

function RootComponent() {
	const { queryClient } = Route.useRouteContext()

	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<LocationProvider>
					<TooltipProvider>
						<Outlet />
					</TooltipProvider>
				</LocationProvider>
			</AuthProvider>
		</QueryClientProvider>
	)
}
```

## Authentication Guard (`_authenticated.tsx`)

The `_authenticated` layout route protects all child routes. It checks auth state in `beforeLoad` and renders the app shell.

```tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { AppShell } from '@/components/app-shell'
import { authApi } from '@/features/auth/api'

export const Route = createFileRoute('/_authenticated')({
	beforeLoad: async ({ context }) => {
		// Attempt to load current user from cache or fetch
		try {
			await context.queryClient.ensureQueryData(authApi.me.queryOptions(undefined))
		} catch {
			// Not authenticated — redirect to login
			throw redirect({ to: '/login' })
		}
	},
	component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
	return (
		<AppShell>
			<Outlet />
		</AppShell>
	)
}
```

### How It Works

1. `beforeLoad` runs before any child route renders.
2. Calls `GET /auth/me` via TanStack Query (`ensureQueryData` — returns cached if fresh, fetches if stale/missing).
3. If the request fails (401) → `throw redirect({ to: '/login' })`.
4. If successful → user is authenticated, child routes render inside `AppShell`.

### After Login Navigation

```tsx
// In login page, after successful login:
const navigate = useNavigate()
await login(username, password)
navigate({ to: '/' }) // → hits _authenticated.beforeLoad → /me succeeds → dashboard renders
```

## App Shell Layout

The `_authenticated` layout renders the persistent app shell:

```
┌─────────────────────────────────────────────────────┐
│ Header                         [Location Switcher ▼] │
├──────────┬──────────────────────────────────────────┤
│ Sidebar  │                                          │
│          │  Page Content (<Outlet />)               │
│ Dashboard│                                          │
│ Master ▸ │                                          │
│ POS    ▸ │                                          │
│ Inventory│                                          │
│ Settings │                                          │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

- **Sidebar:** Collapsible, grouped by domain (see 02-project-structure.md for groups).
- **Header:** Location switcher, user menu, breadcrumbs.
- **Content:** `<Outlet />` renders the active child route.

## Route Loaders (Data Prefetching)

A list route prefetches in a `loader` (keyed off validated search via `loaderDeps`) and the component reads the same options with `useSuspenseQuery`, so it renders guaranteed data with no `isLoading` branch — loading/error move to `pendingComponent`/`errorComponent`. This is the pattern proven on the `location` pilot (ADR-0016):

```tsx
const listQueryOptions = (search: ListSearch) =>
	locationResource.list.queryOptions({ page: search.page, limit: search.pageSize, q: search.q })

export const Route = createFileRoute('/_authenticated/master/locations/')({
	validateSearch: listSearchSchema,
	loaderDeps: ({ search }) => search,
	loader: ({ context, deps }) => context.queryClient.ensureQueryData(listQueryOptions(deps)),
	pendingComponent: () => <PageSkeleton />,
	errorComponent: ({ reset }) => <PageError onRetry={reset} />,
	component: LocationsPage,
})

function LocationsPage() {
	const search = Route.useSearch()
	// suspenseOptions() bridges UseQueryOptions → UseSuspenseQueryOptions (ADR-0016)
	const { data } = useSuspenseQuery(suspenseOptions(listQueryOptions(search)))
	// …
}
```

A detail route is the same shape, keyed off `params` instead of `search`.

### `validateSearch`

TanStack Router's search param validation. Uses Zod schemas to parse and validate URL search params. Invalid params get defaults.

```tsx
// URL: /master/materials?page=2&search=kopi
// validateSearch parses → { page: 2, search: 'kopi', limit: 20 }
```

## Location Query Param (`?loc=`)

Location-sensitive pages include the active location ID in URL search params for shareability.

### Defining Location-Aware Search Params

```tsx
import { z } from 'zod'

const LocationSensitiveSearch = z.object({
	loc: z.coerce.number().optional(), // location ID from URL
})

export const Route = createFileRoute('/_authenticated/inventory/stock')({
	validateSearch: (search) => StockFilterDto.merge(LocationSensitiveSearch).parse(search),
	component: StockPage,
})
```

### Reading Location in Components

```tsx
function StockPage() {
	const { loc } = Route.useSearch()
	const { activeLocation } = useLocation()

	// URL param takes priority over context
	const effectiveLocationId = loc ?? activeLocation?.id ?? null
	// ...
}
```

### Updating Location in URL

When the user switches location on a location-sensitive page:

```tsx
const navigate = useNavigate()

function onLocationSwitch(newLocationId: number | null) {
	// Update URL search param
	navigate({
		search: (prev) => ({
			...prev,
			loc: newLocationId ?? undefined, // remove param if null (consolidated)
		}),
	})
}
```

## Pages That DON'T Use `?loc=`

Global pages have no location concept in their URL:

| Route                     | Location param?  |
| ------------------------- | ---------------- |
| `/settings/*`             | No               |
| `/master/locations`       | No               |
| `/master/uom`             | No               |
| `/master/suppliers`       | No               |
| `/master/materials`       | No (global list) |
| `/master/menu`            | Yes              |
| `/master/recipes`         | Yes              |
| `/master/payment-methods` | Yes              |
| `/pos/*`                  | Yes              |
| `/inventory/*`            | Yes              |
| `/` (dashboard)           | Yes (optional)   |

## Pending and Error Components

TanStack Router supports route-level loading/error UI:

```tsx
export const Route = createFileRoute('/_authenticated/master/materials')({
	loader: ({ context, search }) => {
		/* ... */
	},
	pendingComponent: () => <PageSkeleton />,
	errorComponent: ({ error }) => <PageError error={error} />,
	component: MaterialsPage,
})
```

- `pendingComponent` — shown during `loader` execution (page-level skeleton).
- `errorComponent` — shown if `loader` throws (page-level error boundary).
- Loader-backed routes read with `useSuspenseQuery`, so page-level loading/error live entirely at the route boundary (`pendingComponent`/`errorComponent`). Mutations still surface their own errors inline within the page.

See [06-ui-patterns.md](./06-ui-patterns.md) for error/loading UI patterns.

## Not Found Route

Defined in `__root.tsx`:

```tsx
notFoundComponent: () => (
  <main className="container mx-auto p-4 pt-16">
    <h1>404</h1>
    <p>The requested page could not be found.</p>
  </main>
),
```

## Route Naming Conventions

| Convention                | Example                                  |
| ------------------------- | ---------------------------------------- |
| Layout route (no URL)     | `_authenticated.tsx` (underscore prefix) |
| Index route               | `index.tsx` in folder                    |
| Feature route             | `materials.tsx`, `orders.tsx`            |
| Nested with params        | `$orderId.tsx`                           |
| Route groups (no URL seg) | `_authenticated/` folder                 |

---

**Next:** [06-ui-patterns.md](./06-ui-patterns.md) — Component sources, forms, tables, and error/loading states.
