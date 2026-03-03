import z from 'zod'
import { zPrimitive, zSchema } from '@/lib/zod'

/* --------------------------------- ENTITY --------------------------------- */

export const MaterialLocationDto = z.object({
  id: zPrimitive.str,
  materialId: zPrimitive.str,
  locationId: zPrimitive.str,

  // Per-location configuration
  minStock: zPrimitive.num,
  maxStock: zPrimitive.num.nullable(),
  reorderPoint: zPrimitive.num,

  // Stock tracking
  stockStart: zPrimitive.num,
  stockAdjustment: zPrimitive.num,
  stockSell: zPrimitive.num,
  stockPurchase: zPrimitive.num,
  stockEnd: zPrimitive.num,

  ...zSchema.meta.shape,
})

export type MaterialLocationDto = z.infer<typeof MaterialLocationDto>

/* --------------------------------- SELECT --------------------------------- */

/** Stock view — used in "stock list per location" */
export const MaterialLocationStockDto = z.object({
  id: zPrimitive.str,
  materialId: zPrimitive.str,
  locationId: zPrimitive.str,
  materialName: zPrimitive.str,
  materialSku: zPrimitive.str,
  baseUom: zPrimitive.str,
  minStock: zPrimitive.num,
  maxStock: zPrimitive.num.nullable(),
  reorderPoint: zPrimitive.num,
  stockStart: zPrimitive.num,
  stockAdjustment: zPrimitive.num,
  stockSell: zPrimitive.num,
  stockPurchase: zPrimitive.num,
  stockEnd: zPrimitive.num,
})

export type MaterialLocationStockDto = z.infer<typeof MaterialLocationStockDto>

/* -------------------------------- MUTATION -------------------------------- */

/** Assign materials to a location (batch) */
export const MaterialLocationAssignDto = z.object({
  locationId: zPrimitive.str,
  materialIds: zPrimitive.str.array().min(1),
})

export type MaterialLocationAssignDto = z.infer<
  typeof MaterialLocationAssignDto
>

/** Unassign a material from a location */
export const MaterialLocationUnassignDto = z.object({
  materialId: zPrimitive.str,
  locationId: zPrimitive.str,
})

export type MaterialLocationUnassignDto = z.infer<
  typeof MaterialLocationUnassignDto
>

/** Update per-location config */
export const MaterialLocationConfigDto = z.object({
  id: zPrimitive.str,
  minStock: zPrimitive.num.min(0).optional(),
  maxStock: zPrimitive.num.min(0).nullable().optional(),
  reorderPoint: zPrimitive.num.min(0).optional(),
})

export type MaterialLocationConfigDto = z.infer<
  typeof MaterialLocationConfigDto
>

/** Update stock values */
export const MaterialLocationStockUpdateDto = z.object({
  id: zPrimitive.str,
  stockAdjustment: zPrimitive.num.optional(),
  stockSell: zPrimitive.num.optional(),
  stockPurchase: zPrimitive.num.optional(),
})

export type MaterialLocationStockUpdateDto = z.infer<
  typeof MaterialLocationStockUpdateDto
>
