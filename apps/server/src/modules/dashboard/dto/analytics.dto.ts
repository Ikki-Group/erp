import { z } from 'zod'
import { zDate } from '@/core/validation'

export const PnLRequestDto = z.object({ startDate: zDate, endDate: zDate })

export const TopSalesRequestDto = z.object({
	startDate: zDate,
	endDate: zDate,
	limit: z.number().int().positive().optional().default(5),
})

export type PnLRequestDto = z.infer<typeof PnLRequestDto>
export type TopSalesRequestDto = z.infer<typeof TopSalesRequestDto>
