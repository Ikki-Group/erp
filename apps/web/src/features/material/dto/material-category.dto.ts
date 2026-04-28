import z from 'zod'

import { zp, zc, zq } from '@/lib/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const MaterialCategoryDto = z.object({
	...zc.RecordId.shape,
	name: zp.str,
	description: zp.strNullable,
	parentId: zp.id.nullable(),
	...zc.AuditFull.shape,
})

export type MaterialCategoryDto = z.infer<typeof MaterialCategoryDto>

/* --------------------------------- FILTER --------------------------------- */

export const MaterialCategoryFilterDto = z.object({ q: zq.search, parentId: zp.id.optional() })

export type MaterialCategoryFilterDto = z.infer<typeof MaterialCategoryFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const MaterialCategoryMutationDto = MaterialCategoryDto.pick({
	name: true,
	description: true,
	parentId: true,
})

export type MaterialCategoryMutationDto = z.infer<typeof MaterialCategoryMutationDto>
export const MaterialCategoryUpdateDto = z.object({ ...zc.RecordId.shape, ...MaterialCategoryMutationDto.shape })

export type MaterialCategoryUpdateDto = z.infer<typeof MaterialCategoryUpdateDto>
