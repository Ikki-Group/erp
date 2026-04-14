import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { Suspense } from 'react'

import { initSentry } from '@/lib/sentry'
import { queryClient } from '@/lib/tanstack-query'
import { createRouter } from '@/lib/tanstack-router'

import { ThemeListener } from './components/providers/theme'

const router = createRouter()
initSentry(router)

export function App() {
	return (
		<Suspense>
			<ThemeListener />
			<QueryClientProvider client={queryClient}>
				<RouterProvider router={router} context={{ qc: queryClient }} />
			</QueryClientProvider>
		</Suspense>
	)
}
