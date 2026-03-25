import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import * as Sentry from '@sentry/react'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { ThemeProvider } from 'next-themes'
import type { RouteContext } from '@/lib/tanstack-router'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { authApi } from '@/features/auth'
import { useAppState } from '@/hooks/use-app-state'
import { ApiError } from '@/lib/api'

export const Route = createRootRouteWithContext<RouteContext>()({
  beforeLoad: async ({ context }) => {
    const token = useAppState.getState().token

    if (token) {
      await context.qc
        .ensureQueryData(authApi.me.query({}))
        .then(res => {
          useAppState.getState().invalidateSessionData(res.data)
        })
        .catch(err => {
          if (err instanceof ApiError && err.status === 401) {
            useAppState.getState().clearToken()
          }
        })
    }
  },
  component: RootComponent,
})

function RootComponent() {
  return (
    <ThemeProvider attribute='class'>
      <TooltipProvider>
        <Sentry.ErrorBoundary
          fallback={({ error }: { error: any }) => (
            <div>Error: {error?.message || 'Unknown error'}</div>
          )}
        >
          <Outlet />
        </Sentry.ErrorBoundary>
        <ReactQueryDevtools buttonPosition='bottom-left' />
        <TanStackRouterDevtools position='bottom-right' />
        <Toaster position='top-right' />
      </TooltipProvider>
    </ThemeProvider>
  )
}
