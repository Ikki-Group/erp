import { z } from 'zod'

import { zp } from '@/lib/validation'

export const dashboardKpiFilterSchema = z.object({ locationId: zp.id.optional() })

export type DashboardKpiFilterDto = z.infer<typeof dashboardKpiFilterSchema>

export const dashboardKpiSelectSchema = z.object({
	totalStockValue: z.number(),
	totalActiveSku: z.number(),
	lowStockCount: z.number(),
})

export type DashboardKpiSelectDto = z.infer<typeof dashboardKpiSelectSchema>
