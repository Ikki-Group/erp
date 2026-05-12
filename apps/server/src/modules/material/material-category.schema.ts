/**
 * Material Category Schemas — Core validation schemas
 */

import { z, zc, zp, zq } from '@ikki/api-contract/validation'

import { MaterialCategoryEntity } from './domain/material-category.entity'

/* -------------------------------- RESPONSE -------------------------------- */

export const MaterialCategorySchema = MaterialCategoryEntity
export type MaterialCategorySchema = z.infer<typeof MaterialCategorySchema>

/* --------------------------------- FILTER --------------------------------- */

export const MaterialCategoryFilterSchema = z.object({
	...zq.pagination.shape,
	q: zq.search,
	parentId: zq.id.optional(),
})
export type MaterialCategoryFilterSchema = z.infer<typeof MaterialCategoryFilterSchema>

/* -------------------------------- MUTATION -------------------------------- */

export const MaterialCategoryMutationSchema = z.object({
	name: zc.strTrim.min(1).max(100),
	description: zc.strTrimNullable,
	parentId: zp.id.optional().nullable(),
})
export type MaterialCategoryMutationSchema = z.infer<typeof MaterialCategoryMutationSchema>

export const MaterialCategoryCreateSchema = MaterialCategoryMutationSchema
export type MaterialCategoryCreateSchema = z.infer<typeof MaterialCategoryCreateSchema>

export const MaterialCategoryUpdateSchema = MaterialCategoryMutationSchema.extend({
	...zc.RecordId.shape,
})
export type MaterialCategoryUpdateSchema = z.infer<typeof MaterialCategoryUpdateSchema>
