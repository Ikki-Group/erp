import { createFileRoute } from '@tanstack/react-router'
import { MaterialFormPage } from '@/features/material/components/material-form-page'

export const Route = createFileRoute('/_app/materials/create')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <MaterialFormPage
      mode='create'
      backTo={{
        from: Route.fullPath,
        to: '/materials',
      }}
    />
  )
}
