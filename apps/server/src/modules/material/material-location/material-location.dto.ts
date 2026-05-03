import { z } from 'zod'

import { LocationDto } from '@/modules/location'

import { UomDto } from '../uom/uom.dto'
import { zc, zp, zq } from '@/lib/validation'

/* ---------------------------------- ENTITY ---------------------------------- */

export const MaterialLocationDto = z.object({
	...zc.RecordId.shape,
	materialId: zp.id,
	locationId: zp.id,

	// Per-location configuration
	minStock: zp.decimal,
	maxStock: zp.decimal.nullable(),
	reorderPoint: zp.decimal,

	// Current stock snapshot
	currentQty: zp.decimal,
	currentAvgCost: zp.decimal,
	currentValue: zp.decimal,
	...zc.AuditBasic.shape,
})

export type MaterialLocationDto = z.infer<typeof MaterialLocationDto>

/* --------------------------------- RESULT --------------------------------- */

/** Enriched view with location details */
export const MaterialLocationWithLocationDto = MaterialLocationDto.extend({
	location: LocationDto,
})

export type MaterialLocationWithLocationDto = z.infer<typeof MaterialLocationWithLocationDto>

/** Stock view — used in "stock list per location" */
export const MaterialLocationStockDto = z.object({
	id: zp.id,
	materialId: zp.id,
	locationId: zp.id,
	materialName: zp.str,
	materialSku: zp.str,
	baseUomId: zp.id,
	uom: UomDto.nullable(),
	minStock: zp.decimal,
	maxStock: zp.decimal.nullable(),
	reorderPoint: zp.decimal,
	currentQty: zp.decimal,
	currentAvgCost: zp.decimal,
	currentValue: zp.decimal,
})

export type MaterialLocationStockDto = z.infer<typeof MaterialLocationStockDto>

/* --------------------------------- FILTER --------------------------------- */

export const MaterialLocationFilterDto = z.object({
	...zq.pagination.shape,
	locationId: zq.id,
	q: zq.search,
})

export type MaterialLocationFilterDto = z.infer<typeof MaterialLocationFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

/** Assign materials to locations (batch) */
export const MaterialLocationAssignDto = z.object({
	locationIds: z.array(zp.id).min(1),
	materialIds: z.array(zp.id).min(1),
})

export type MaterialLocationAssignDto = z.infer<typeof MaterialLocationAssignDto>

/** Unassign a material from a location */
export const MaterialLocationUnassignDto = z.object({
	materialId: zq.id,
	locationId: zq.id,
})

export type MaterialLocationUnassignDto = z.infer<typeof MaterialLocationUnassignDto>

/** Update per-location config (min/max stock, reorder point) */
export const MaterialLocationConfigDto = z.object({
	...zc.RecordId.shape,
	minStock: zp.decimal.refine((v) => Number(v) >= 0, 'Must be at least 0').optional(),
	maxStock: zp.decimal
		.refine((v) => Number(v) >= 0, 'Must be at least 0')
		.nullable()
		.optional(),
	reorderPoint: zp.decimal.refine((v) => Number(v) >= 0, 'Must be at least 0').optional(),
})

export type MaterialLocationConfigDto = z.infer<typeof MaterialLocationConfigDto>
