import { z } from 'zod'

import { zc, zp, zq } from '@/lib/validation'

/* ---------------------------------- ENTITY ---------------------------------- */

export const ProductCategoryDto = z.object({
	...zc.RecordId.shape,
	name: zp.str,
	description: zp.strNullable,
	parentId: zp.id.nullable(),
	...zc.AuditBasic.shape,
})

export type ProductCategoryDto = z.infer<typeof ProductCategoryDto>

/* --------------------------------- FILTER --------------------------------- */

export const ProductCategoryFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	parentId: zq.id.optional(),
})

export type ProductCategoryFilterDto = z.infer<typeof ProductCategoryFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

const ProductCategoryMutationDto = z.object({
	name: zc.strTrim.min(1).max(100),
	description: zc.strTrimNullable,
	parentId: zp.id.optional().nullable(),
})

export const ProductCategoryCreateDto = ProductCategoryMutationDto
export type ProductCategoryCreateDto = z.infer<typeof ProductCategoryCreateDto>

export const ProductCategoryUpdateDto = ProductCategoryMutationDto.extend({
	...zc.RecordId.shape,
})
export type ProductCategoryUpdateDto = z.infer<typeof ProductCategoryUpdateDto>
