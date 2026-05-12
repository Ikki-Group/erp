/**
 * Material Category DTOs — HTTP boundary schemas
 */

import { z, zc, zp, zq } from '@ikki/api-contract/validation'

import { MaterialCategoryEntity } from '../domain/material-category.entity'

/* -------------------------------- RESPONSE -------------------------------- */

export const MaterialCategoryDto = MaterialCategoryEntity
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
export type MaterialCategoryMutationDto = z.infer<typeof MaterialCategoryMutationDto>

export const MaterialCategoryCreateDto = MaterialCategoryMutationDto
export type MaterialCategoryCreateDto = z.infer<typeof MaterialCategoryCreateDto>

export const MaterialCategoryUpdateDto = MaterialCategoryMutationDto.extend({
	...zc.RecordId.shape,
})
export type MaterialCategoryUpdateDto = z.infer<typeof MaterialCategoryUpdateDto>
