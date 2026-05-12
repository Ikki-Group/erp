/**
 * Material Conversion Schemas — Core validation schemas
 */

import { z, zc, zp, zq } from '@ikki/api-contract/validation'

import { MaterialConversionEntity } from './domain/material-conversion.entity'
import { UomEntity } from './domain/uom.entity'

/* -------------------------------- RESPONSE -------------------------------- */

export const MaterialConversionSchema = MaterialConversionEntity
export type MaterialConversionSchema = z.infer<typeof MaterialConversionSchema>

export const MaterialConversionDetailSchema = z.object({
	...MaterialConversionEntity.shape,
	uom: UomEntity,
})
export type MaterialConversionDetailSchema = z.infer<typeof MaterialConversionDetailSchema>

/* -------------------------------- MUTATION -------------------------------- */

export const MaterialConversionCreateSchema = z.object({
	materialId: zp.id,
	uomId: zp.id,
	toBaseFactor: zp.decimal,
})
export type MaterialConversionCreateSchema = z.infer<typeof MaterialConversionCreateSchema>

export const MaterialConversionUpdateSchema = z.object({
	...zc.RecordId.shape,
	...MaterialConversionCreateSchema.shape,
})
export type MaterialConversionUpdateSchema = z.infer<typeof MaterialConversionUpdateSchema>

/* --------------------------------- FILTER --------------------------------- */

export const MaterialConversionFilterSchema = z.object({
	materialId: zq.id.optional(),
	uomId: zq.id.optional(),
	...zq.pagination.shape,
})
export type MaterialConversionFilterSchema = z.infer<typeof MaterialConversionFilterSchema>
