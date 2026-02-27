import { createFileRoute, redirect } from '@tanstack/react-router'
import { AppLayout } from '@/components/layout/app-layout'
import { LoadingPage } from '@/components/common/loading-page'
import { useAuth } from '@/lib/auth'

export const Route = createFileRoute('/_app')({
  beforeLoad: () => {
    const isAuthenticated = useAuth.getState().isAuthenticated()
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
