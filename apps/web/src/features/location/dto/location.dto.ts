import { z, zc, zp, zq } from '@ikki/api-contract/validation'

/** Types of operational location. */
export const LocationTypeDto = z.enum(['store', 'warehouse'])
export type LocationTypeDto = z.infer<typeof LocationTypeDto>


export const LocationDto = z.object({
	...zc.RecordId.shape,
	code: zp.str,
	name: zp.str,
	type: LocationTypeDto,
	description: zp.str.nullable(),
	address: zp.str.nullable(),
	phone: zp.str.nullable(),
	isActive: zp.bool,
	...zc.AuditBasic.shape,
})
export type LocationDto = z.infer<typeof LocationDto>

export const LocationCreateDto = z.object({
	code: zc.strTrim,
	name: zc.strTrim,
	type: LocationTypeDto,
	description: zc.strTrimNullable,
	address: zc.strTrimNullable,
	phone: zc.strTrimNullable,
	isActive: zp.bool,
})
export type LocationCreateDto = z.infer<typeof LocationCreateDto>

export const LocationUpdateDto = z.object({
	...zc.RecordId.shape,
	...LocationCreateDto.shape
})
export type LocationUpdateDto = z.infer<typeof LocationUpdateDto>

export const LocationFilterDto = z.object({
	q: zq.search,
	...zq.pagination.shape,
})
export type LocationFilterDto = z.infer<typeof LocationFilterDto>
