import { createFileRoute } from '@tanstack/react-router'

import { AllocationPage } from '@/features/inventory'

export const Route = createFileRoute('/_app/inventory/allocation')({ component: AllocationPage })
