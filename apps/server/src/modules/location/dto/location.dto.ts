import { z } from 'zod'

import { zc, zp, zq } from '@/core/validation'

/**
 * Types of operational locations.
 */
export const LocationTypeDto = z.enum([
	/** Retail storefront for customers. */
	'store',
	/** Storage facility for inventory. */
	'warehouse',
])
export type LocationTypeDto = z.infer<typeof LocationTypeDto>

export const LocationDto = z.object({
	...zc.RecordId.shape,
	code: zp.str,
	name: zp.str,
	type: LocationTypeDto,
	description: zp.strNullable,
	address: zp.strNullable,
	phone: zp.strNullable,
	isActive: zp.bool,
	...zc.AuditFull.shape,
})
export type LocationDto = z.infer<typeof LocationDto>

export const LocationCreateDto = z.object({
	code: zc.strTrim.uppercase().min(3).max(10),
	name: zc.strTrim.min(3).max(100),
	type: LocationTypeDto,
	description: zc.strTrimNullable,
	address: zc.strTrimNullable,
	phone: zc.strTrimNullable,
	isActive: zp.bool.default(true),
})
export type LocationCreateDto = z.infer<typeof LocationCreateDto>

export const LocationUpdateDto = z.object({ ...zc.RecordId.shape, ...LocationCreateDto.shape })
export type LocationUpdateDto = z.infer<typeof LocationUpdateDto>

export const LocationFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	type: LocationTypeDto.optional(),
})
export type LocationFilterDto = z.infer<typeof LocationFilterDto>
