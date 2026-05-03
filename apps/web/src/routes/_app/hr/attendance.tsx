import { createFileRoute } from '@tanstack/react-router'

import { AttendancePage } from '@/features/hr'

export const Route = createFileRoute('/_app/hr/attendance')({ component: AttendancePage })
