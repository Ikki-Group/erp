import { z, zc, zp, zq } from '@ikki/api-contract/validation'

/* ---------------------------------- ENTITY ---------------------------------- */

export const ProductCategorySchema = z.object({
	...zc.RecordId.shape,
	name: zp.str,
	description: zp.strNullable,
	locationId: zp.id,
	...zc.AuditBasic.shape,
})

export type ProductCategorySchema = z.infer<typeof ProductCategorySchema>

/* --------------------------------- FILTER --------------------------------- */

export const ProductCategoryFilterSchema = z.object({
	...zq.pagination.shape,
	q: zq.search,
	locationId: zq.id.optional(),
})

export type ProductCategoryFilterSchema = z.infer<typeof ProductCategoryFilterSchema>

/* -------------------------------- MUTATION -------------------------------- */

const ProductCategoryMutationSchema = z.object({
	name: zc.strTrim.min(1).max(100),
	description: zc.strTrimNullable,
	locationId: zp.id,
})

export const ProductCategoryCreateSchema = ProductCategoryMutationSchema
export type ProductCategoryCreateSchema = z.infer<typeof ProductCategoryCreateSchema>

export const ProductCategoryUpdateSchema = ProductCategoryMutationSchema.extend({
	...zc.RecordId.shape,
})
export type ProductCategoryUpdateSchema = z.infer<typeof ProductCategoryUpdateSchema>
