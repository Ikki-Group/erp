import { createFileRoute } from '@tanstack/react-router'

import { ProductFormPage } from '@/features/product'

export const Route = createFileRoute('/_app/products/create')({ component: RouteComponent })

function RouteComponent() {
  return <ProductFormPage mode="create" backTo={{ to: '/products' }} />
}
