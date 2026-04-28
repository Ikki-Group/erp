import z from 'zod'

import { zp, zc, zq } from '@/lib/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const ProductCategoryDto = z.object({
	...zc.RecordId.shape,
	name: zp.str,
	description: zp.strNullable,
	parentId: zp.id.nullable(),
	...zc.AuditFull.shape,
})

export type ProductCategoryDto = z.infer<typeof ProductCategoryDto>

/* --------------------------------- FILTER --------------------------------- */

export const ProductCategoryFilterDto = z.object({ q: zq.search, parentId: zp.id.optional() })

export type ProductCategoryFilterDto = z.infer<typeof ProductCategoryFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const ProductCategoryMutationDto = ProductCategoryDto.pick({
	name: true,
	description: true,
	parentId: true,
})

export type ProductCategoryMutationDto = z.infer<typeof ProductCategoryMutationDto>
export const ProductCategoryUpdateDto = z.object({ ...zc.RecordId.shape, ...ProductCategoryMutationDto.shape })

export type ProductCategoryUpdateDto = z.infer<typeof ProductCategoryUpdateDto>
