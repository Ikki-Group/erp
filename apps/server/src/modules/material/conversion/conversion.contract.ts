/**
 * Material Conversion — HTTP boundary schemas
 */

import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema'

import { UomDto } from '@/modules/uom'

/* --------------------------------- ENTITY --------------------------------- */

export const MaterialConversionEntity = z.object({
	...zc.RecordId.shape,
	materialId: zp.id,
	uomId: zp.id,
	toBaseFactor: zp.decimal,
	...zc.AuditBasic.shape,
})
export type MaterialConversion = z.infer<typeof MaterialConversionEntity>

/* -------------------------------- RESPONSE -------------------------------- */

export const MaterialConversionDto = MaterialConversionEntity
export type MaterialConversionDto = z.infer<typeof MaterialConversionDto>

export const MaterialConversionDetailDto = z.object({
	...MaterialConversionEntity.shape,
	uom: UomDto,
})
export type MaterialConversionDetailDto = z.infer<typeof MaterialConversionDetailDto>

/* -------------------------------- MUTATION -------------------------------- */

export const MaterialConversionCreateDto = z.object({
	materialId: zp.id,
	uomId: zp.id,
	toBaseFactor: zp.decimal,
})
export type MaterialConversionCreateDto = z.infer<typeof MaterialConversionCreateDto>

export const MaterialConversionUpdateDto = z.object({
	...zc.RecordId.shape,
	...MaterialConversionCreateDto.shape,
})
export type MaterialConversionUpdateDto = z.infer<typeof MaterialConversionUpdateDto>

/* --------------------------------- FILTER --------------------------------- */

export const MaterialConversionFilterDto = z.object({
	materialId: zq.id.optional(),
	uomId: zq.id.optional(),
	...zq.pagination.shape,
})
export type MaterialConversionFilterDto = z.infer<typeof MaterialConversionFilterDto>
