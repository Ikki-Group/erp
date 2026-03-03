import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/lib/validation'

import { LocationDto } from '@/modules/location/dto'

/* --------------------------------- ENTITY --------------------------------- */

export const MaterialLocationDto = z.object({
  id: zPrimitive.objId,
  materialId: zPrimitive.objId,
  locationId: zPrimitive.objId,

  // Per-location configuration
  minStock: zPrimitive.num.default(0),
  maxStock: zPrimitive.num.nullable().default(null),
  reorderPoint: zPrimitive.num.default(0),

  // Stock tracking
  stockStart: zPrimitive.num.default(0),
  stockAdjustment: zPrimitive.num.default(0),
  stockSell: zPrimitive.num.default(0),
  stockPurchase: zPrimitive.num.default(0),
  stockEnd: zPrimitive.num.default(0),

  ...zSchema.metadata.shape,
})

export type MaterialLocationDto = z.infer<typeof MaterialLocationDto>

/* --------------------------------- SELECT --------------------------------- */

/** Enriched view with location details — used in "locations assigned to material" */
export const MaterialLocationWithLocationDto = z.object({
  ...MaterialLocationDto.shape,
  location: LocationDto,
})

export type MaterialLocationWithLocationDto = z.infer<typeof MaterialLocationWithLocationDto>

/** Stock view — used in "stock list per location" */
export const MaterialLocationStockDto = z.object({
  id: zPrimitive.objId,
  materialId: zPrimitive.objId,
  locationId: zPrimitive.objId,
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

/* --------------------------------- FILTER --------------------------------- */

export const MaterialLocationFilterDto = z.object({
  locationId: zHttp.query.objId,
  search: zHttp.query.search,
})

export type MaterialLocationFilterDto = z.infer<typeof MaterialLocationFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

/** Assign materials to a location (batch) */
export const MaterialLocationAssignDto = z.object({
  locationId: zPrimitive.objId,
  materialIds: zPrimitive.objId.array().min(1),
})

export type MaterialLocationAssignDto = z.infer<typeof MaterialLocationAssignDto>

/** Unassign a material from a location */
export const MaterialLocationUnassignDto = z.object({
  materialId: zPrimitive.objId,
  locationId: zPrimitive.objId,
})

export type MaterialLocationUnassignDto = z.infer<typeof MaterialLocationUnassignDto>

/** Update per-location config (min/max stock, reorder point) */
export const MaterialLocationConfigDto = z.object({
  id: zPrimitive.objId,
  minStock: zPrimitive.num.min(0).optional(),
  maxStock: zPrimitive.num.min(0).nullable().optional(),
  reorderPoint: zPrimitive.num.min(0).optional(),
})

export type MaterialLocationConfigDto = z.infer<typeof MaterialLocationConfigDto>

/** Update stock values */
export const MaterialLocationStockUpdateDto = z.object({
  id: zPrimitive.objId,
  stockAdjustment: zPrimitive.num.optional(),
  stockSell: zPrimitive.num.optional(),
  stockPurchase: zPrimitive.num.optional(),
})

export type MaterialLocationStockUpdateDto = z.infer<typeof MaterialLocationStockUpdateDto>
