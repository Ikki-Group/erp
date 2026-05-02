import { z } from 'zod'

import { zp, zc } from '@/lib/validation'

/** Single material count in a stock opname */
const StockOpnameItemDto = z.object({
	materialId: zp.id,
	physicalQty: z.coerce
		.string()
		.refine((v) => Number(v) >= 0, 'Physical quantity cannot be negative'),
	notes: zc.strTrimNullable.optional(),
})

/** Stock Opname: Recording physical count for multiple materials at one location */
export const StockOpnameDto = z.object({
	locationId: zp.id,
	date: zp.date,
	referenceNo: zc.strTrim.min(3).max(50),
	notes: zc.strTrimNullable.optional(),
	items: z.array(StockOpnameItemDto).min(1, 'At least one item is required'),
})
export type StockOpnameDto = z.infer<typeof StockOpnameDto>
