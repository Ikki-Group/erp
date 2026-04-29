import { z } from 'zod'

import { zp } from '@/lib/validation'

/* --------------------------------- REQUEST -------------------------------- */

export const PnLRequestDto = z.object({ startDate: zp.date, endDate: zp.date })

export type PnLRequestDto = z.infer<typeof PnLRequestDto>

export const TopSalesRequestDto = z.object({
	startDate: zp.date,
	endDate: zp.date,
	limit: zp.num.int().positive().optional().default(5),
})

export type TopSalesRequestDto = z.infer<typeof TopSalesRequestDto>

/* -------------------------------- RESPONSE -------------------------------- */

export const PnLDataDto = z.object({
	revenue: z.number(),
	cogs: z.number(),
	operatingExpenses: z.number(),
	netProfit: z.number(),
	period: z.object({ start: zp.date, end: zp.date }),
})

export type PnLDataDto = z.infer<typeof PnLDataDto>

export const TopSalesItemDto = z.object({
	productId: z.number().nullable(),
	itemName: z.string(),
	totalQuantity: z.number(),
	totalRevenue: z.number(),
})

export type TopSalesItemDto = z.infer<typeof TopSalesItemDto>
