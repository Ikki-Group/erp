import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'

import { ThemeProvider } from 'next-themes'

import { useAppState } from '@/hooks/use-app-state'

import { ApiError } from '@/lib/api'
import type { RouteContext } from '@/lib/tanstack-router'

import { ConfirmDialog } from '@/components/blocks/feedback/confirm-dialog'

import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

import { authApi } from '@/features/auth'

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
				<Outlet />
				<ConfirmDialog.Root />
				<Toaster position="top-right" />
			</TooltipProvider>
		</ThemeProvider>
	)
}
