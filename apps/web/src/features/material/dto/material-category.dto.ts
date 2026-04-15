import z from 'zod'

import { zId, zMetadataDto, zQuerySearch, zRecordIdDto, zStr, zStrNullable } from '@/lib/zod'

/* --------------------------------- ENTITY --------------------------------- */

export const MaterialCategoryDto = z.object({
	...zRecordIdDto.shape,
	name: zStr,
	description: zStrNullable,
	parentId: zId.nullable(),
	...zMetadataDto.shape,
})

export type MaterialCategoryDto = z.infer<typeof MaterialCategoryDto>

/* --------------------------------- FILTER --------------------------------- */

export const MaterialCategoryFilterDto = z.object({ q: zQuerySearch, parentId: zId.optional() })

export type MaterialCategoryFilterDto = z.infer<typeof MaterialCategoryFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const MaterialCategoryMutationDto = MaterialCategoryDto.pick({
	name: true,
	description: true,
	parentId: true,
})

export type MaterialCategoryMutationDto = z.infer<typeof MaterialCategoryMutationDto>
