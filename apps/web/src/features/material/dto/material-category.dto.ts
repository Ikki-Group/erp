import z from 'zod'

import { zp, zc, zq } from '@/lib/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const MaterialCategoryDto = z.object({
	...zc.RecordId.shape,
	name: zp.str,
	description: zp.strNullable,
	parentId: zp.id.nullable(),
	...zc.AuditBasic.shape,
})

export type MaterialCategoryDto = z.infer<typeof MaterialCategoryDto>

/* --------------------------------- FILTER --------------------------------- */

export const MaterialCategoryFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	parentId: zq.id.optional(),
})

export type MaterialCategoryFilterDto = z.infer<typeof MaterialCategoryFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const MaterialCategoryMutationDto = z.object({
	name: zc.strTrim.min(1).max(100),
	description: zc.strTrimNullable,
	parentId: zp.id.optional().nullable(),
})

export const MaterialCategoryCreateDto = MaterialCategoryMutationDto
export type MaterialCategoryCreateDto = z.infer<typeof MaterialCategoryCreateDto>

export const MaterialCategoryUpdateDto = MaterialCategoryMutationDto.extend({
	...zc.RecordId.shape,
})
export type MaterialCategoryUpdateDto = z.infer<typeof MaterialCategoryUpdateDto>
