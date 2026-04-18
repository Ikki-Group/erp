import { z } from 'zod'

import { zp } from '@/core/validation'

export const PnLRequestDto = z.object({
	startDate: zp.date,
	endDate: zp.date,
})
export type PnLRequestDto = z.infer<typeof PnLRequestDto>

export const TopSalesRequestDto = z.object({
	startDate: zp.date,
	endDate: zp.date,
	limit: zp.num.int().positive().optional().default(5),
})
export type TopSalesRequestDto = z.infer<typeof TopSalesRequestDto>
