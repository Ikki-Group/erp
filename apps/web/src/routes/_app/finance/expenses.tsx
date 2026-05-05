import { createFileRoute } from '@tanstack/react-router'

import { FinanceExpensesPage } from '@/features/finance'

export const Route = createFileRoute('/_app/finance/expenses')({ component: FinanceExpensesPage })
