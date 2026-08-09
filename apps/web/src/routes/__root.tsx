import { TanStackDevtools } from '@tanstack/react-devtools'
import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import { Confirm } from '@/components/shared/confirm'
import { ConfirmInput } from '@/components/shared/confirm-input'
import { FormDialog } from '@/components/shared/form-dialog'

import { Toaster } from '@/components/ui/toast'
import { TooltipProvider } from '@/components/ui/tooltip'

import appCss from '../styles.css?url'

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
	notFoundComponent: () => (
		<main className="container mx-auto p-4 pt-16">
			<h1>404</h1>
			<p>The requested page could not be found.</p>
		</main>
	),
	shellComponent: RootComponent,
})

function RootComponent() {
	const { queryClient } = Route.useRouteContext()

	return (
		<QueryClientProvider client={queryClient}>
			<Toaster>
				<TooltipProvider>
					<Outlet />
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
		</QueryClientProvider>
	)
}
