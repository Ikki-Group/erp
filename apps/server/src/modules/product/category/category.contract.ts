import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema'

/* ---------------------------------- ENTITY ---------------------------------- */

export const ProductCategoryDto = z.object({
	id: zp.id,
	code: zp.str,
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
	code: zc.strTrim.min(1).max(50),
	name: zc.strTrim.min(1).max(100),
	description: zc.strTrimNullable,
	locationId: zp.id,
})

export const ProductCategoryCreateDto = ProductCategoryMutationDto
export type ProductCategoryCreateDto = z.infer<typeof ProductCategoryCreateDto>

export const ProductCategoryUpdateDto = z.object({
	id: zp.id,
	...ProductCategoryMutationDto.shape,
})
export type ProductCategoryUpdateDto = z.infer<typeof ProductCategoryUpdateDto>
