import { Outlet, createFileRoute, isRedirect, redirect } from '@tanstack/react-router'

import { queryClient } from '@/lib/tanstack-query.ts'

import { AppShell } from '@/components/app-shell'
import { AppBootScreen } from '@/components/shared/app-boot-screen.tsx'
import { NotFound } from '@/components/shared/not-found'

import { authMeQuery } from '@/features/auth/api.ts'

import { useAuth } from '@/providers/auth-provider.tsx'
import { LocationProvider } from '@/providers/location-provider.tsx'

export const Route = createFileRoute('/_authenticated')({
	beforeLoad: async ({ location }) => {
		try {
			// `ensureQueryData` is a "has this ever been checked" gate, not a
			// per-navigation re-verification: on cold boot the cache is empty, so
			// this performs a real fetch; on every subsequent client-side
			// navigation under `_authenticated/*` the cache already holds the
			// result and this returns it synchronously with zero network calls
			// (see .scratch/tanstack-router-auth-guard-research.md). The actual
			// "is my session still valid" watchdog is `AuthProvider`'s own
			// `useQuery(authMeQuery)`, which reacts to the `session` freshness
			// tier + window-focus/reconnect — not this call.
			const data = await queryClient.ensureQueryData(authMeQuery.queryOptions())
			if (!data?.data?.user) {
				throw redirect({ to: '/login', search: { redirect: location.href } })
			}
		} catch (error) {
			if (isRedirect(error)) throw error
			// Auth failed (401, network) → redirect to login, remembering where
			// the user was headed so they land back there after signing in again.
			throw redirect({ to: '/login', search: { redirect: location.href } })
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
