import z from 'zod'

import { zId, zStr, zNum, zDate, zStrNullable } from '@/core/validation'

/**
 * Single material count in a stock opname.
 */
export const stockOpnameItemSchema = z.object({
  materialId: zId,
  physicalQty: zNum.nonnegative('Physical quantity cannot be negative'),
  notes: zStrNullable.optional(),
})

export type StockOpnameItemDto = z.infer<typeof stockOpnameItemSchema>

/**
 * Stock Opname Header: Recording physical count for multiple materials at one location.
 */
export const stockOpnameSchema = z.object({
  locationId: zId,
  date: zDate,
  referenceNo: zStr,
  notes: zStrNullable.optional(),
  items: stockOpnameItemSchema.array().min(1, 'At least one item is required'),
})

export type StockOpnameDto = z.infer<typeof stockOpnameSchema>
