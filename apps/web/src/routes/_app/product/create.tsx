import { createFileRoute } from '@tanstack/react-router'

import { ProductFormPage } from '@/features/product'

export const Route = createFileRoute('/_app/product/create')({ component: RouteComponent })

function RouteComponent() {
	return <ProductFormPage mode="create" backTo={{ to: '/product' }} />
}
