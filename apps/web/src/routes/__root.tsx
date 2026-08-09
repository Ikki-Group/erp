import { TanStackDevtools } from '@tanstack/react-devtools'
import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import { Confirm } from '@/components/shared/confirm'
import { ConfirmInput } from '@/components/shared/confirm-input'
import { FormDialog } from '@/components/shared/form-dialog'
import { NotFound } from '@/components/shared/not-found'

import { Toaster } from '@/components/ui/toast'
import { TooltipProvider } from '@/components/ui/tooltip'

import appCss from '../styles.css?url'
import { AuthProvider } from '@/providers/auth-provider.tsx'
import { ThemeProvider } from '@/providers/theme-provider'

interface RouterContext {
	queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: 'utf-8',
			},
			{
				name: 'viewport',
				content: 'width=device-width, initial-scale=1',
			},
			{
				title: 'TanStack Start Starter',
			},
		],
		links: [
			{
				rel: 'stylesheet',
				href: appCss,
			},
		],
	}),
	notFoundComponent: () => <NotFound className="min-h-svh" />,
	component: RootComponent,
})

function RootComponent() {
	const { queryClient } = Route.useRouteContext()

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider>
				<Toaster>
					<TooltipProvider>
						<AuthProvider>
							<Outlet />
						</AuthProvider>
						<Confirm />
						<ConfirmInput />
						<FormDialog />
						<TanStackDevtools
							config={{
								position: 'bottom-right',
							}}
							plugins={[
								{
									name: 'TanStack Router',
									render: <TanStackRouterDevtoolsPanel />,
								},
							]}
						/>
						<ReactQueryDevtools buttonPosition="bottom-left" />
					</TooltipProvider>
				</Toaster>
			</ThemeProvider>
		</QueryClientProvider>
	)
}
