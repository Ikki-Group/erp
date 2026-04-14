import { zId } from '@/lib/zod'

import { z } from 'zod'

export const dashboardKpiFilterSchema = z.object({ locationId: zId.optional() })

export type DashboardKpiFilterDto = z.infer<typeof dashboardKpiFilterSchema>

export const dashboardKpiSelectSchema = z.object({
	totalStockValue: z.number(),
	totalActiveSku: z.number(),
	lowStockCount: z.number(),
})

export type DashboardKpiSelectDto = z.infer<typeof dashboardKpiSelectSchema>
