import { createFileRoute } from '@tanstack/react-router'

import { PayrollPage } from '@/features/hr'

export const Route = createFileRoute('/_app/hr/payroll')({ component: PayrollPage })
