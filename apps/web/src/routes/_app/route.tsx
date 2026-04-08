import { createFileRoute, redirect } from '@tanstack/react-router'

import { LoadingPage } from '@/components/blocks/feedback/loading-page'
import { AppLayout } from '@/components/layout/app-layout'
import { useAppState } from '@/hooks/use-app-state'

export const Route = createFileRoute('/_app')({
  beforeLoad: () => {
    const isAuthenticated = useAppState.getState().isAuthenticated()
    if (!isAuthenticated) {
      const url = new URL(window.location.href)

      let redirectTo: string | undefined = url.pathname.replace(url.origin, '')
      if (redirectTo === '/') redirectTo = undefined

      throw redirect({ to: '/login', search: { redirectTo } })
    }

    return
  },
  component: RouteComponent,
  pendingComponent: () => <LoadingPage />,
})

function RouteComponent() {
  return <AppLayout />
}
