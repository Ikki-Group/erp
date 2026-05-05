import { createFileRoute } from '@tanstack/react-router'

import { SalesOrdersPage } from '@/features/sales'

export const Route = createFileRoute('/_app/sales/orders')({ component: SalesOrdersPage })
