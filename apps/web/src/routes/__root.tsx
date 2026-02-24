import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import * as Sentry from '@sentry/react'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { RouteContext } from '@/lib/tanstack-router'

export const Route = createRootRouteWithContext<RouteContext>()({
  component: RootComponent,
})

function RootComponent() {
  return (
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
      <Toaster position="top-right" richColors />
    </TooltipProvider>
  )
}
