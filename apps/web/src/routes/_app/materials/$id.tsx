import { createFileRoute } from '@tanstack/react-router'
import { materialApi } from '@/features/material'
import { MaterialFormPage } from '@/features/material/components/material-form-page'

export const Route = createFileRoute('/_app/materials/$id')({
  loader: async ({ context, params }) => {
    await context.qc.ensureQueryData(
      materialApi.detail.query({ id: Number(params.id) })
    )
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()

  return (
    <MaterialFormPage
      mode='update'
      id={id}
      backTo={{
        from: Route.fullPath,
        to: '/materials',
      }}
    />
  )
}
