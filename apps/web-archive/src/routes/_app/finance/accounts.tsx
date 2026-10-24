import { createFileRoute } from '@tanstack/react-router'

import { FinanceAccountsPage } from '@/features/finance'

export const Route = createFileRoute('/_app/finance/accounts')({ component: FinanceAccountsPage })
