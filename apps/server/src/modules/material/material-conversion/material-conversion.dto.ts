import { z, zc, zp, zq } from '@ikki/api-contract/validation'

import { UomDto } from '../uom/uom.dto'

export const MaterialConversionDto = z.object({
	...zc.RecordId.shape,
	materialId: zp.id,
	uomId: zp.id,
	toBaseFactor: zp.decimal,
	...zc.AuditBasic.shape,
})
export type MaterialConversionDto = z.infer<typeof MaterialConversionDto>

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

export const MaterialConversionFilterDto = z.object({
	materialId: zq.id.optional(),
	uomId: zq.id.optional(),
	...zq.pagination.shape,
})
export type MaterialConversionFilterDto = z.infer<typeof MaterialConversionFilterDto>

export const MaterialConversionDetailDto = z.object({
	...MaterialConversionDto.shape,
	uom: UomDto,
})
export type MaterialConversionDetailDto = z.infer<typeof MaterialConversionDetailDto>
