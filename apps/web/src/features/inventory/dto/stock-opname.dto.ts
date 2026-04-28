import { z } from 'zod'

import { zDate, zId, zNum, zStr, zStrNullable } from '@/lib/validation'

/**
 * Single material count in a stock opname.
 */
export const StockOpnameItemDto = z.object({
	materialId: zId,
	physicalQty: zNum.nonnegative('Physical quantity cannot be negative'),
	notes: zStrNullable.optional(),
})

export type StockOpnameItemDto = z.infer<typeof StockOpnameItemDto>

/**
 * Stock Opname Header: Recording physical count for multiple materials at one location.
 */
export const StockOpnameDto = z.object({
	locationId: zId,
	date: zDate,
	referenceNo: zStr,
	notes: zStrNullable.optional(),
	items: StockOpnameItemDto.array().min(1, 'At least one item is required'),
})

export type StockOpnameDto = z.infer<typeof StockOpnameDto>
