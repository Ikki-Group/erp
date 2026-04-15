import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import * as Sentry from '@sentry/react'
import { ThemeProvider } from 'next-themes'

import { ApiError } from '@/lib/api'
import type { RouteContext } from '@/lib/tanstack-router'

import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

import { authApi } from '@/features/auth'

import { useAppState } from '@/hooks/use-app-state'

export const Route = createRootRouteWithContext<RouteContext>()({
	beforeLoad: async ({ context }) => {
		const token = useAppState.getState().token

		if (token) {
			const data = await context.qc
				.ensureQueryData(authApi.me.query({}))
				.then((res) => res.data)
				.catch((err) => {
					if (err instanceof ApiError && err.status === 401) {
						useAppState.getState().clearToken()
					}
				})

			if (data) {
				useAppState.getState().invalidateSessionData(data)
			}
		}
	},
	component: RootComponent,
})

function RootComponent() {
	return (
		<ThemeProvider attribute="class">
			<TooltipProvider>
				<Sentry.ErrorBoundary>
					<Outlet />
				</Sentry.ErrorBoundary>
				<ReactQueryDevtools buttonPosition="bottom-left" />
				<TanStackRouterDevtools position="bottom-right" />
				<Toaster position="top-right" />
			</TooltipProvider>
		</ThemeProvider>
	)
}
