import { createFileRoute, Outlet } from '@tanstack/react-router'
import { MainLayout } from '@/components/common/layout/MainLayout'

export const Route = createFileRoute('/_auth')({
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  )
}
