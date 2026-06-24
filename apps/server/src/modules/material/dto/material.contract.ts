/**
 * Material DTOs — HTTP boundary schemas
 *
 * - Response schemas re-export entity for consistency
 * - Create/Update schemas add validation rules (trim, min, max)
 * - Filter schemas define query param shapes
 */

import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema'

import { MaterialCategoryEntity } from '../domain/material-category.entity'
import { MaterialConversionEntity } from '../domain/material-conversion.entity'
import { MaterialEntity, MaterialTypeDto } from '../domain/material.entity'

/* -------------------------------- RESPONSE -------------------------------- */

/** Response schema — entity shape as-is */
export const MaterialDto = MaterialEntity
export type MaterialDto = z.infer<typeof MaterialDto>



/** Detail response — entity + resolved relations */
export const MaterialDetailDto = z.object({
	...MaterialEntity.shape,
	category: MaterialCategoryEntity.nullable(),
	conversions: z.array(MaterialConversionEntity),
})
export type MaterialDetailDto = z.infer<typeof MaterialDetailDto>

/* -------------------------------- MUTATION -------------------------------- */

export const MaterialCreateDto = z.object({
	name: zc.strTrim.min(3).max(100),
	description: zc.strTrimNullable,
	sku: zc.strTrim.min(3).max(50).transform((v) => v.toUpperCase()),
	type: MaterialTypeDto,
	categoryId: zp.id,
	baseUomId: zp.id,
	locationIds: z.array(zp.id).default([]),
	conversions: z
		.array(
			z.object({
				toBaseFactor: zp.decimal,
				uomId: zp.id,
			}),
		)
		.default([]),
})
export type MaterialCreateDto = z.infer<typeof MaterialCreateDto>

/** Update uses same shape as create — PUT semantics */
export const MaterialUpdateDto = MaterialCreateDto
export type MaterialUpdateDto = z.infer<typeof MaterialUpdateDto>

/* --------------------------------- FILTER --------------------------------- */

export const MaterialFilterDto = z.object({
	...zq.pagination.shape,
	search: zq.search,
	type: MaterialTypeDto.optional(),
	categoryId: zq.id.optional(),
	locationIds: zq.ids.optional(),
	excludeLocationIds: zq.ids.optional(),
})
export type MaterialFilterDto = z.infer<typeof MaterialFilterDto>


