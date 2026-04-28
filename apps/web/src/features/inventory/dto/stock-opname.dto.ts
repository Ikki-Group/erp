import { z } from 'zod'

import { zp } from '@/lib/validation'

/**
 * Single material count in a stock opname.
 */
export const StockOpnameItemDto = z.object({
	materialId: zp.id,
	physicalQty: zp.num.nonnegative('Physical quantity cannot be negative'),
	notes: zp.strNullable.optional(),
})

export type StockOpnameItemDto = z.infer<typeof StockOpnameItemDto>

/**
 * Stock Opname Header: Recording physical count for multiple materials at one location.
 */
export const StockOpnameDto = z.object({
	locationId: zp.id,
	date: zp.date,
	referenceNo: zp.str,
	notes: zp.strNullable.optional(),
	items: StockOpnameItemDto.array().min(1, 'At least one item is required'),
})

export type StockOpnameDto = z.infer<typeof StockOpnameDto>
