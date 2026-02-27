import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { useAuth } from '@/lib/auth'

export const Route = createFileRoute('/_auth')({
  beforeLoad: () => {
    const isAuthenticated = useAuth.getState().isAuthenticated()
    if (isAuthenticated) {
      throw redirect({ to: '/' })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className='min-h-svh flex flex-col'>
      <Outlet />
    </div>
  )
}
