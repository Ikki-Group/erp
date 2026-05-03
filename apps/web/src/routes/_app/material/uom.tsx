import { createFileRoute } from '@tanstack/react-router'

import { UomListPage } from '@/features/material'

export const Route = createFileRoute('/_app/material/uom')({ component: UomListPage })
