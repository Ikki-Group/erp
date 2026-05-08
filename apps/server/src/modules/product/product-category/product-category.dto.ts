import { z, zc, zp, zq } from '@ikki/api-contract/validation'

/* ---------------------------------- ENTITY ---------------------------------- */

export const ProductCategoryDto = z.object({
	...zc.RecordId.shape,
	name: zp.str,
	description: zp.strNullable,
	locationId: zp.id,
	...zc.AuditBasic.shape,
})

export type ProductCategoryDto = z.infer<typeof ProductCategoryDto>

/* --------------------------------- FILTER --------------------------------- */

export const ProductCategoryFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	locationId: zq.id.optional(),
})

export type ProductCategoryFilterDto = z.infer<typeof ProductCategoryFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

const ProductCategoryMutationDto = z.object({
	name: zc.strTrim.min(1).max(100),
	description: zc.strTrimNullable,
	locationId: zp.id,
})

export const ProductCategoryCreateDto = ProductCategoryMutationDto
export type ProductCategoryCreateDto = z.infer<typeof ProductCategoryCreateDto>

export const ProductCategoryUpdateDto = ProductCategoryMutationDto.extend({
	...zc.RecordId.shape,
})
export type ProductCategoryUpdateDto = z.infer<typeof ProductCategoryUpdateDto>
