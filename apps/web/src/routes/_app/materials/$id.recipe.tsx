import { createFileRoute } from '@tanstack/react-router'
import { materialApi } from '@/features/material'
import { RecipeFormPage } from '@/features/recipe/components/recipe-form-page'

export const Route = createFileRoute('/_app/materials/$id/recipe')({
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
    <RecipeFormPage
      targetType='material'
      targetId={Number(id)}
      backTo={{
        from: Route.fullPath,
        to: '/materials',
      }}
    />
  )
}
