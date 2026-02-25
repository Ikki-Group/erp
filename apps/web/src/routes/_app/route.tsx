import { AppLayout } from '@/components/layout/app-layout'
import { createFileRoute } from '@tanstack/react-router'
import { LoadingPage } from '@/components/common/loading-page'

export const Route = createFileRoute('/_app')({
  component: RouteComponent,
  pendingComponent: () => <LoadingPage />,
})

function RouteComponent() {
  return <AppLayout />
}
