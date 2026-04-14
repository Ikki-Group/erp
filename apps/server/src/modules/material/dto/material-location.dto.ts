import z from 'zod'

import {
	zStr,
	zNum,
	zId,
	zQuerySearch,
	zQueryId,
	zMetadataDto,
	zRecordIdDto,
} from '@/core/validation'
import { LocationDto } from '@/modules/location'

import { UomDto } from './uom.dto'

/* ---------------------------------- ENTITY --------------------------------- */

export const MaterialLocationDto = z.object({
	...zRecordIdDto.shape,
	materialId: zId,
	locationId: zId,

	// Per-location configuration
	minStock: zNum.default(0),
	maxStock: zNum.nullable().default(null),
	reorderPoint: zNum.default(0),

	// Current stock snapshot (maintained by inventory module)
	currentQty: zNum.default(0),
	currentAvgCost: zNum.default(0),
	currentValue: zNum.default(0),
	...zMetadataDto.shape,
})

export type MaterialLocationDto = z.infer<typeof MaterialLocationDto>

/* --------------------------------- RESULT --------------------------------- */

/** Enriched view with location details — used in "locations assigned to material" */
export const MaterialLocationWithLocationDto = z.object({
	...MaterialLocationDto.shape,
	location: LocationDto,
})

export type MaterialLocationWithLocationDto = z.infer<typeof MaterialLocationWithLocationDto>

/* ... */
/** Stock view — used in "stock list per location" */
export const MaterialLocationStockDto = z.object({
	id: zId,
	materialId: zId,
	locationId: zId,
	materialName: zStr,
	materialSku: zStr,
	baseUomId: zId,
	uom: UomDto.nullable(),
	minStock: zNum,
	maxStock: zNum.nullable(),
	reorderPoint: zNum,
	currentQty: zNum,
	currentAvgCost: zNum,
	currentValue: zNum,
})

export type MaterialLocationStockDto = z.infer<typeof MaterialLocationStockDto>

/* --------------------------------- FILTER --------------------------------- */

export const MaterialLocationFilterDto = z.object({ locationId: zQueryId, search: zQuerySearch })

export type MaterialLocationFilterDto = z.infer<typeof MaterialLocationFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

/** Assign materials to locations (batch) */
export const MaterialLocationAssignDto = z.object({
	locationIds: zId.array().min(1),
	materialIds: zId.array().min(1),
})

export type MaterialLocationAssignDto = z.infer<typeof MaterialLocationAssignDto>

/** Unassign a material from a location */
export const MaterialLocationUnassignDto = z.object({ materialId: zId, locationId: zId })

export type MaterialLocationUnassignDto = z.infer<typeof MaterialLocationUnassignDto>

/** Update per-location config (min/max stock, reorder point) */
export const MaterialLocationConfigDto = z.object({
	id: zId,
	minStock: zNum.min(0).optional(),
	maxStock: zNum.min(0).nullable().optional(),
	reorderPoint: zNum.min(0).optional(),
})

export type MaterialLocationConfigDto = z.infer<typeof MaterialLocationConfigDto>
