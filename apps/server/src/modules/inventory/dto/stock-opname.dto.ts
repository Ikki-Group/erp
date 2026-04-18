import { z } from 'zod'

import { zc, zp } from '@/core/validation'

/**
 * Single material count in a stock opname.
 */
const StockOpnameItemDto = z.object({
	materialId: zp.id,
	physicalQty: zp.decimal.nonnegative('Physical quantity cannot be negative'),
	notes: zc.strTrimNullable,
})

export type StockOpnameItemDto = z.infer<typeof StockOpnameItemDto>

/**
 * Stock Opname Header: Recording physical count for multiple materials at one location.
 */
export const StockOpnameDto = z.object({
	locationId: zp.id,
	date: zp.date,
	referenceNo: zc.strTrim.min(3).max(50),
	notes: zc.strTrimNullable,
	items: z.array(StockOpnameItemDto).min(1, 'At least one item is required'),
})

export type StockOpnameDto = z.infer<typeof StockOpnameDto>
