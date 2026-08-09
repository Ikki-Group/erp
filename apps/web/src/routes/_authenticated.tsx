import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { queryClient } from '@/lib/tanstack-query.ts'

import { AppShell } from '@/components/app-shell'
import { NotFound } from '@/components/shared/not-found'

import { authMeQuery } from '@/features/auth/api.ts'

import { useAuth } from '@/providers/auth-provider.tsx'
import { LocationProvider } from '@/providers/location-provider.tsx'

export const Route = createFileRoute('/_authenticated')({
	beforeLoad: async () => {
		try {
			const data = await queryClient.ensureQueryData(authMeQuery.queryOptions(undefined as never))
			if (!data?.data?.user) {
				throw redirect({ to: '/login' })
			}
		} catch (error) {
			// If it's a redirect, rethrow
			if (error && typeof error === 'object' && 'to' in error) throw error
			// Auth failed (401, network) → redirect to login
			throw redirect({ to: '/login' })
		}
	},
	notFoundComponent: () => <NotFound />,
	component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
	const { locations, user } = useAuth()

	// Query is guaranteed by beforeLoad; guard for type safety
	if (!user) return null

	// Derive activeLocation from me query cache
	const meData = queryClient.getQueryData(authMeQuery.queryKey(undefined as never)) as
		| { data: { activeLocation: { id: number; code: string; name: string; type: string } | null } }
		| undefined

	return (
		<LocationProvider locations={locations} activeLocation={meData?.data?.activeLocation ?? null}>
			<AppShell>
				<Outlet />
			</AppShell>
		</LocationProvider>
	)
}
