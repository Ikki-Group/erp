import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema/index.ts'

// ─── Response ───

export const MaterialCategoryDto = z.object({
	id: zp.id,
	name: zp.str,
	...zc.AuditBasic.shape,
})
export type MaterialCategoryDto = z.infer<typeof MaterialCategoryDto>

// ─── Filter ───

export const MaterialCategoryFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
})
export type MaterialCategoryFilterDto = z.infer<typeof MaterialCategoryFilterDto>

// ─── Mutation Base (internal) ───

const MaterialCategoryMutationDto = z.object({
	name: zc.strTrim.min(2).max(100),
})

// ─── Create / Update ───

export const MaterialCategoryCreateDto = MaterialCategoryMutationDto
export type MaterialCategoryCreateDto = z.infer<typeof MaterialCategoryCreateDto>

export const MaterialCategoryUpdateDto = z.object({
	id: zp.id,
	...MaterialCategoryMutationDto.shape,
})
export type MaterialCategoryUpdateDto = z.infer<typeof MaterialCategoryUpdateDto>
