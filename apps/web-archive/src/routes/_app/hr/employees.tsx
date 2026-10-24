import { createFileRoute } from '@tanstack/react-router'

import { EmployeeListPage } from '@/features/hr/pages/employee-list-page'

export const Route = createFileRoute('/_app/hr/employees')({
	component: EmployeeListPage,
})
