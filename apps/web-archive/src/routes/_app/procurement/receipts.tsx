import { createFileRoute } from '@tanstack/react-router'

import { ReceiptsPage } from '@/features/purchasing'

export const Route = createFileRoute('/_app/procurement/receipts')({ component: ReceiptsPage })
