import { AppLayout } from '@/components/layout/app-layout'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app')({
  component: RouteComponent,
})

import { ConfirmProvider } from '@/providers/confirm-provider'

function RouteComponent() {
  return (
    <ConfirmProvider>
      <AppLayout />
    </ConfirmProvider>
  )
}
