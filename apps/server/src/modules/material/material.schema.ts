/**
 * Material Schemas — Core validation schemas
 *
 * These are the base schemas that define the structure of material data.
 * They are used by DTOs for HTTP layer validation.
 */

import { z, zc, zp, zq } from '@ikki/api-contract/validation'

import { MaterialCategoryEntity } from './domain/material-category.entity'
import { MaterialConversionEntity } from './domain/material-conversion.entity'
import { MaterialEntity, MaterialTypeSchema } from './domain/material.entity'

/* -------------------------------- RESPONSE -------------------------------- */

/** Response schema — entity shape as-is */
export const MaterialSchema = MaterialEntity
export type MaterialSchema = z.infer<typeof MaterialSchema>

/** Detail response — entity + resolved relations */
export const MaterialDetailSchema = z.object({
	...MaterialEntity.shape,
	category: MaterialCategoryEntity.nullable(),
	conversions: z.array(MaterialConversionEntity),
})
export type MaterialDetailSchema = z.infer<typeof MaterialDetailSchema>

/* -------------------------------- MUTATION -------------------------------- */

export const MaterialCreateSchema = z.object({
	name: zc.strTrim.min(3).max(100),
	description: zc.strTrimNullable,
	sku: zc.strTrim.min(3).max(50).toUpperCase(),
	type: MaterialTypeSchema,
	categoryId: zp.id.nullable(),
	baseUomId: zp.id,
	locationIds: z.array(zp.id).default([]),
	conversions: z
		.array(
			z.object({
				toBaseFactor: zp.decimal,
				uomId: zp.id,
			}),
		)
		.default([]),
})
export type MaterialCreateSchema = z.infer<typeof MaterialCreateSchema>

/** Update uses same shape as create — PUT semantics */
export const MaterialUpdateSchema = MaterialCreateSchema
export type MaterialUpdateSchema = z.infer<typeof MaterialUpdateSchema>

/* --------------------------------- FILTER --------------------------------- */

export const MaterialFilterSchema = z.object({
	...zq.pagination.shape,
	search: zq.search,
	type: MaterialTypeSchema.optional(),
	categoryId: zq.id.optional(),
	locationIds: zq.ids.optional(),
	excludeLocationIds: zq.ids.optional(),
})
export type MaterialFilterSchema = z.infer<typeof MaterialFilterSchema>
