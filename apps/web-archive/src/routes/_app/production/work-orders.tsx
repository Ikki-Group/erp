import { createFileRoute } from '@tanstack/react-router'

import { WorkOrdersPage } from '@/features/production'

export const Route = createFileRoute('/_app/production/work-orders')({ component: WorkOrdersPage })
