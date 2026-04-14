import z from 'zod'

import {
	zStrNullable,
	zStr,
	zId,
	zQuerySearch,
	zMetadataDto,
	zRecordIdDto,
	zQueryId,
} from '@/core/validation'

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

export const MaterialCategoryFilterDto = z.object({
	search: zQuerySearch,
	parentId: zQueryId.optional(),
})

export type MaterialCategoryFilterDto = z.infer<typeof MaterialCategoryFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const MaterialCategoryMutationDto = z.object({
	...MaterialCategoryDto.pick({ name: true, description: true, parentId: true }).shape,
})

export type MaterialCategoryMutationDto = z.infer<typeof MaterialCategoryMutationDto>
