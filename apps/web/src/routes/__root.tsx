import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import * as Sentry from '@sentry/react'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { ThemeProvider } from 'next-themes'
import type { RouteContext } from '@/lib/tanstack-router'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'

export const Route = createRootRouteWithContext<RouteContext>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <ThemeProvider attribute="class">
      <TooltipProvider>
        <Sentry.ErrorBoundary
          fallback={({ error }: { error: any }) => (
            <div>Error: {error?.message || 'Unknown error'}</div>
          )}
        >
          <Outlet />
        </Sentry.ErrorBoundary>
        <ReactQueryDevtools buttonPosition="bottom-left" />
        <TanStackRouterDevtools position="bottom-right" />
        <Toaster position="top-right" />
      </TooltipProvider>
    </ThemeProvider>
  )
}
