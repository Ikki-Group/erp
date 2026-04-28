import { zp } from '@/lib/validation'

export const PnLRequestDto = z.object({ startDate: zp.date, endDate: zp.date })

export const TopSalesRequestDto = z.object({
	startDate: zp.date,
	endDate: zp.date,
	limit: z.number().int().positive().optional().default(5),
})

export type PnLRequestDto = z.infer<typeof PnLRequestDto>
export type TopSalesRequestDto = z.infer<typeof TopSalesRequestDto>
