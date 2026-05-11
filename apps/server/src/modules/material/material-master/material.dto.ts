import { z, zc, zp, zq } from '@ikki/api-contract/validation'

import { MaterialCategoryDto } from '../material-category/material-category.dto'
import { UomDto } from '../uom/uom.dto'

/* ---------------------------------- ENUM ---------------------------------- */

export const MaterialType = z.enum(['raw', 'semi', 'packaging'])
export type MaterialType = z.infer<typeof MaterialType>

/* --------------------------------- ENTITY --------------------------------- */

export const MaterialDto = z.object({
	...zc.RecordId.shape,
	name: zp.str,
	description: zp.strNullable,
	sku: zp.str,
	type: MaterialType,
	categoryId: zp.id.nullable(),
	baseUomId: zp.id,
	...zc.AuditBasic.shape,
})
export type MaterialDto = z.infer<typeof MaterialDto>

export const MaterialConversionDto = z.object({
	...zc.RecordId.shape,
	materialId: zp.id,
	uomId: zp.id,
	toBaseFactor: zp.decimal,
	...zc.AuditBasic.shape,
})
export type MaterialConversionDto = z.infer<typeof MaterialConversionDto>

/* -------------------------------- MUTATION -------------------------------- */

export const MaterialMutationDto = z.object({
	name: zc.strTrim.min(3).max(100),
	description: zc.strTrimNullable,
	sku: zc.strTrim.min(3).max(50).toUpperCase(),
	type: MaterialType,
	categoryId: zp.id.nullable(),
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
export type MaterialMutationDto = z.infer<typeof MaterialMutationDto>

/* --------------------------------- FILTER --------------------------------- */

export const MaterialFilterDto = z.object({
	...zq.pagination.shape,
	search: zq.search,
	type: MaterialType.optional(),
	categoryId: zq.id.optional(),
	locationIds: zq.ids.optional(),
	excludeLocationIds: zq.ids.optional(),
})
export type MaterialFilterDto = z.infer<typeof MaterialFilterDto>

/* --------------------------------- RESULT --------------------------------- */

const MaterialConversionDetailDto = z.object({
	...MaterialConversionDto.shape,
	uom: UomDto,
})

export const MaterialDetailDto = z.object({
	...MaterialDto.shape,
	category: MaterialCategoryDto.nullable(),
	conversions: z.array(MaterialConversionDetailDto),
})
export type MaterialDetailDto = z.infer<typeof MaterialDetailDto>

/** @deprecated */
export const MaterialSelectDto = z.object({
	...MaterialDto.shape,
	category: MaterialCategoryDto.nullable(),
})

/** @deprecated */
export type MaterialSelectDto = z.infer<typeof MaterialSelectDto>
