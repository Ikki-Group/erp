import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { useAppState } from '@/hooks/use-app-state'

export const Route = createFileRoute('/_auth')({
  beforeLoad: () => {
    const isAuthenticated = useAppState.getState().isAuthenticated()
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
