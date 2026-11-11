import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema/index.ts'

// ─── Response ───

export const MenuCategoryDto = z.object({
	id: zp.id,
	locationId: zp.id,
	name: zp.str,
	parentId: z.number().int().positive().nullable(),
	sortOrder: z.number().int(),
	...zc.AuditBasic.shape,
})
export type MenuCategoryDto = z.infer<typeof MenuCategoryDto>

// ─── Filter ───

export const MenuCategoryFilterDto = z.object({
	...zq.pagination.shape,
	locationId: z.coerce.number().int().positive(),
	q: zq.search,
})
export type MenuCategoryFilterDto = z.infer<typeof MenuCategoryFilterDto>

// ─── Mutation Base ───

const MenuCategoryMutationDto = z.object({
	locationId: zp.id,
	name: zc.strTrim.min(2).max(100),
	parentId: z.number().int().positive().nullable().optional(),
	sortOrder: z.number().int().min(0).default(0),
})

// ─── Create / Update ───

export const MenuCategoryCreateDto = MenuCategoryMutationDto
export type MenuCategoryCreateDto = z.infer<typeof MenuCategoryCreateDto>

export const MenuCategoryUpdateDto = z.object({
	id: zp.id,
	...MenuCategoryMutationDto.omit({ locationId: true }).shape,
})
export type MenuCategoryUpdateDto = z.infer<typeof MenuCategoryUpdateDto>
