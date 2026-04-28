import z from 'zod'

import { zp, zc, zq } from '@/lib/validation'

import { LocationDto } from '@/features/location'

import { UomDto } from './uom.dto'

/* --------------------------------- ENTITY --------------------------------- */

export const MaterialLocationDto = z.object({
	id: zp.id,
	materialId: zp.id,
	locationId: zp.id,

	// Per-location configuration
	minStock: z.coerce.number().default(0),
	maxStock: z.coerce.number().nullable().default(null),
	reorderPoint: z.coerce.number().default(0),

	// Current stock snapshot (maintained by inventory module)
	currentQty: z.coerce.number().default(0),
	currentAvgCost: z.coerce.number().default(0),
	currentValue: z.coerce.number().default(0),

	...zc.AuditFull.shape,
})

export type MaterialLocationDto = z.infer<typeof MaterialLocationDto>

/* --------------------------------- OUTPUT --------------------------------- */

/** Enriched view with location details — used in "locations assigned to material" */
export const MaterialLocationWithLocationDto = z.object({
	...MaterialLocationDto.shape,
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
	minStock: zp.num,
	maxStock: zp.num.nullable(),
	reorderPoint: zp.num,
	currentQty: zp.num,
	currentAvgCost: zp.num,
	currentValue: zp.num,
})

export type MaterialLocationStockDto = z.infer<typeof MaterialLocationStockDto>

/* --------------------------------- FILTER --------------------------------- */

export const MaterialLocationFilterDto = z.object({ locationId: zq.id, q: zq.search })

export type MaterialLocationFilterDto = z.infer<typeof MaterialLocationFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

/** Assign materials to locations (batch) */
export const MaterialLocationAssignDto = z.object({
	locationIds: zp.id.array().min(1),
	materialIds: zp.id.array().min(1),
})

export type MaterialLocationAssignDto = z.infer<typeof MaterialLocationAssignDto>

/** Unassign a material from a location */
export const MaterialLocationUnassignDto = z.object({ materialId: zp.id, locationId: zp.id })

export type MaterialLocationUnassignDto = z.infer<typeof MaterialLocationUnassignDto>

/** Update per-location config (min/max stock, reorder point) */
export const MaterialLocationConfigDto = z.object({
	id: zp.id,
	minStock: zp.num.min(0).optional(),
	maxStock: zp.num.min(0).nullable().optional(),
	reorderPoint: zp.num.min(0).optional(),
})

export type MaterialLocationConfigDto = z.infer<typeof MaterialLocationConfigDto>
