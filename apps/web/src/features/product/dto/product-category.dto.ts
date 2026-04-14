import { zId, zMetadataDto, zQuerySearch, zRecordIdDto, zStr, zStrNullable } from '@/lib/zod'

import z from 'zod'

/* --------------------------------- ENTITY --------------------------------- */

export const ProductCategoryDto = z.object({
	...zRecordIdDto.shape,
	name: zStr,
	description: zStrNullable,
	parentId: zId.nullable(),
	...zMetadataDto.shape,
})

export type ProductCategoryDto = z.infer<typeof ProductCategoryDto>

/* --------------------------------- FILTER --------------------------------- */

export const ProductCategoryFilterDto = z.object({ q: zQuerySearch, parentId: zId.optional() })

export type ProductCategoryFilterDto = z.infer<typeof ProductCategoryFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const ProductCategoryMutationDto = ProductCategoryDto.pick({
	name: true,
	description: true,
	parentId: true,
})

export type ProductCategoryMutationDto = z.infer<typeof ProductCategoryMutationDto>
