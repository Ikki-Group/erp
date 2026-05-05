import { createFileRoute } from '@tanstack/react-router'

import { SuppliersPage } from '@/features/supplier'

export const Route = createFileRoute('/_app/procurement/suppliers')({ component: SuppliersPage })
