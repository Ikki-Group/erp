import { createFileRoute } from '@tanstack/react-router'
import { ProductFormPage } from '@/features/product'

export const Route = createFileRoute('/_app/products/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return (
    <ProductFormPage
      mode='update'
      id={Number(id)}
      backTo={{ to: '/products' }}
    />
  )
}
