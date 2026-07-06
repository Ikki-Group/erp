/**
 * Material DTOs — HTTP boundary schemas
 *
 * - Response schemas re-export entity for consistency
 * - Create/Update schemas add validation rules (trim, min, max)
 * - Filter schemas define query param shapes
 */

import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema'

import { MaterialCategoryEntity } from './category/category.contract'
import { MaterialConversionEntity } from './conversion/conversion.contract'

/* ---------------------------------- ENUM ---------------------------------- */

export const MaterialTypeDto = z.enum(['raw', 'semi', 'packaging'])
export type MaterialType = z.infer<typeof MaterialTypeDto>

/* --------------------------------- ENTITY --------------------------------- */

export const MaterialEntity = z.object({
	...zc.RecordId.shape,
	name: zp.str,
	description: zp.strNullable,
	sku: zp.str,
	type: MaterialTypeDto,
	categoryId: zp.id,
	baseUomId: zp.id,
	...zc.AuditBasic.shape,
})
export type Material = z.infer<typeof MaterialEntity>

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
	sku: zc.strTrim
		.min(3)
		.max(50)
		.transform((v) => v.toUpperCase()),
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
