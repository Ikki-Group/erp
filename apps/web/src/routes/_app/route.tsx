import { AppLayout } from '@/components/layout/app-layout'
import { createFileRoute } from '@tanstack/react-router'
import { ConfirmProvider } from '@/providers/confirm-provider'
import { LoadingPage } from '@/components/common/loading-page'

export const Route = createFileRoute('/_app')({
  component: RouteComponent,
  pendingComponent: () => <LoadingPage />,
})

function RouteComponent() {
  return (
    <ConfirmProvider>
      <AppLayout />
    </ConfirmProvider>
  )
}
