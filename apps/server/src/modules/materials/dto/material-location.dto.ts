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

  // Current stock snapshot (maintained by inventory module)
  currentQty: zPrimitive.num.default(0),
  currentAvgCost: zPrimitive.num.default(0),
  currentValue: zPrimitive.num.default(0),

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
  currentQty: zPrimitive.num,
  currentAvgCost: zPrimitive.num,
  currentValue: zPrimitive.num,
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
