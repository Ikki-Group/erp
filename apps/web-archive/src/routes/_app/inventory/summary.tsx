import { createFileRoute } from '@tanstack/react-router'

import { SummaryPage } from '@/features/inventory'

export const Route = createFileRoute('/_app/inventory/summary')({ component: SummaryPage })
