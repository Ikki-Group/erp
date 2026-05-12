/**
 * Material Location Schemas — Core validation schemas
 */

import { z, zc, zp, zq } from '@ikki/api-contract/validation'

import { LocationDto } from '@/modules/location'

import { MaterialLocationEntity } from './domain/material-location.entity'
import { UomEntity } from './domain/uom.entity'

/* -------------------------------- RESPONSE -------------------------------- */

export const MaterialLocationSchema = MaterialLocationEntity
export type MaterialLocationSchema = z.infer<typeof MaterialLocationSchema>

/** Enriched view with location details */
export const MaterialLocationWithLocationSchema = MaterialLocationEntity.extend({
	location: LocationDto,
})
export type MaterialLocationWithLocationSchema = z.infer<typeof MaterialLocationWithLocationSchema>

/** Stock view — used in "stock list per location" */
export const MaterialLocationStockSchema = z.object({
	id: zp.id,
	materialId: zp.id,
	locationId: zp.id,
	materialName: zp.str,
	materialSku: zp.str,
	baseUomId: zp.id,
	uom: UomEntity.nullable(),
	minStock: zp.decimal,
	maxStock: zp.decimal.nullable(),
	reorderPoint: zp.decimal,
	currentQty: zp.decimal,
	currentAvgCost: zp.decimal,
	currentValue: zp.decimal,
})
export type MaterialLocationStockSchema = z.infer<typeof MaterialLocationStockSchema>

/* --------------------------------- FILTER --------------------------------- */

export const MaterialLocationFilterSchema = z.object({
	...zq.pagination.shape,
	locationId: zq.id,
	q: zq.search,
})
export type MaterialLocationFilterSchema = z.infer<typeof MaterialLocationFilterSchema>

/* -------------------------------- MUTATION -------------------------------- */

/** Assign materials to locations (batch) */
export const MaterialLocationAssignSchema = z.object({
	locationIds: z.array(zp.id).min(1),
	materialIds: z.array(zp.id).min(1),
})
export type MaterialLocationAssignSchema = z.infer<typeof MaterialLocationAssignSchema>

/** Unassign a material from a location */
export const MaterialLocationUnassignSchema = z.object({
	materialId: zq.id,
	locationId: zq.id,
})
export type MaterialLocationUnassignSchema = z.infer<typeof MaterialLocationUnassignSchema>

/** Update per-location config (min/max stock, reorder point) */
export const MaterialLocationConfigSchema = z.object({
	...zc.RecordId.shape,
	minStock: zp.decimal.refine((v) => Number(v) >= 0, 'Must be at least 0').optional(),
	maxStock: zp.decimal
		.refine((v) => Number(v) >= 0, 'Must be at least 0')
		.nullable()
		.optional(),
	reorderPoint: zp.decimal.refine((v) => Number(v) >= 0, 'Must be at least 0').optional(),
})
export type MaterialLocationConfigSchema = z.infer<typeof MaterialLocationConfigSchema>
