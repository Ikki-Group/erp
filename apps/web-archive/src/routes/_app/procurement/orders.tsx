import { createFileRoute } from '@tanstack/react-router'

import { OrdersPage } from '@/features/purchasing'

export const Route = createFileRoute('/_app/procurement/orders')({ component: OrdersPage })
