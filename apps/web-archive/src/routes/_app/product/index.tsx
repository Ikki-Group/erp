import { createFileRoute } from '@tanstack/react-router'

import { ProductListPage } from '@/features/product'

export const Route = createFileRoute('/_app/product/')({ component: ProductListPage })
