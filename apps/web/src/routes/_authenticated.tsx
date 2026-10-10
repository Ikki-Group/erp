import { Outlet, createFileRoute, isRedirect, redirect } from '@tanstack/react-router'

import { getActiveLocationId, setActiveLocationId } from '@/lib/api/active-location.ts'
import { isApiError } from '@/lib/api/errors.ts'
import { queryClient } from '@/lib/tanstack-query.ts'

import { AppShell } from '@/components/app-shell'
import { AppBootScreen } from '@/components/shared/app-boot-screen.tsx'
import { NotFound } from '@/components/shared/not-found'

import { authMeQuery } from '@/features/auth/api.ts'

import { useAuth } from '@/providers/auth-provider.tsx'
import { LocationProvider } from '@/providers/location-provider.tsx'

/** A stale `x-location-id` (e.g. access revoked) must not lock the user out: retry consolidated. */
async function loadMe() {
	try {
		return await queryClient.ensureQueryData(authMeQuery.queryOptions())
	} catch (error) {
		if (!isApiError(error) || error.code !== 'LOCATION_ACCESS_DENIED') throw error
		setActiveLocationId(null)
		return queryClient.ensureQueryData(authMeQuery.queryOptions())
	}
}

export const Route = createFileRoute('/_authenticated')({
	beforeLoad: async ({ location }) => {
		const toLogin = () => redirect({ to: '/login', search: { redirect: location.href } })
		try {
			// Cold boot fetches /auth/me; later navigations hit the cache. The live
			// session watchdog is AuthProvider's own useQuery on the same key.
			const data = await loadMe()
			if (!data.data.user) throw toLogin()
			// Drop a persisted location this user can no longer use.
			const activeId = getActiveLocationId()
			if (activeId !== null && !data.data.locations.some((l) => l.id === activeId)) {
				setActiveLocationId(null)
			}
		} catch (error) {
			if (isRedirect(error)) throw error
			throw toLogin()
		}
	},
	pendingComponent: () => <AppBootScreen />,
	notFoundComponent: () => <NotFound />,
	component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
	const { locations, user } = useAuth()

	// Query is guaranteed by beforeLoad; guard for type safety
	if (!user) return null

	return (
		<LocationProvider locations={locations}>
			<AppShell>
				<Outlet />
			</AppShell>
		</LocationProvider>
	)
}
