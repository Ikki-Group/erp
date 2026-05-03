import { createFileRoute } from '@tanstack/react-router'

import { CategoryListPage } from '@/features/material'

export const Route = createFileRoute('/_app/material/category')({ component: CategoryListPage })
