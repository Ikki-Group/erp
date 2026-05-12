/**
 * UOM Schemas — Core validation schemas
 */

import { z, zc, zq } from '@ikki/api-contract/validation'

import { UomEntity } from './domain/uom.entity'

/* -------------------------------- RESPONSE -------------------------------- */

export const UomSchema = UomEntity
export type UomSchema = z.infer<typeof UomSchema>

/* --------------------------------- FILTER --------------------------------- */

export const UomFilterSchema = z.object({
	...zq.pagination.shape,
	q: zq.search,
})
export type UomFilterSchema = z.infer<typeof UomFilterSchema>

/* -------------------------------- MUTATION -------------------------------- */

export const UomMutationSchema = z.object({
	code: zc.strTrim.min(1).max(10).toUpperCase(),
})
export type UomMutationSchema = z.infer<typeof UomMutationSchema>

export const UomCreateSchema = UomMutationSchema
export type UomCreateSchema = z.infer<typeof UomCreateSchema>

export const UomUpdateSchema = UomMutationSchema.extend({
	...zc.RecordId.shape,
})
export type UomUpdateSchema = z.infer<typeof UomUpdateSchema>
