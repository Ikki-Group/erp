import { createFileRoute } from '@tanstack/react-router'

import { SalesInvoicesPage } from '@/features/sales'

export const Route = createFileRoute('/_app/sales/invoices')({ component: SalesInvoicesPage })
