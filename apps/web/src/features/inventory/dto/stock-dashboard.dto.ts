import { z } from 'zod'

import { zp } from '@/lib/validation'

export const DashboardKpiFilterDto = z.object({ locationId: zp.id.optional() })

export type DashboardKpiFilterDto = z.infer<typeof DashboardKpiFilterDto>

export const DashboardKpiSelectDto = z.object({
	totalStockValue: z.number(),
	totalActiveSku: z.number(),
	lowStockCount: z.number(),
})

export type DashboardKpiSelectDto = z.infer<typeof DashboardKpiSelectDto>
