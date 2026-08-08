import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema/index.ts'

// ─── Enums ───

export const LocationTypeEnum = z.enum(['store', 'warehouse'])
export type LocationTypeEnum = z.infer<typeof LocationTypeEnum>

// ─── Mutation Base (internal, not exported) ───

const LocationMutationDto = z.object({
	code: zc.strTrim,
	name: zc.strTrim.min(3).max(100),
	type: LocationTypeEnum,
	address: zc.strTrimNullable.optional(),
	phone: zc.strTrimNullable.optional(),
	isActive: zp.bool.optional().default(true),
})

// ─── Response ───

export const LocationDto = z.object({
	id: zp.id,
	code: zp.str,
	name: zp.str,
	type: LocationTypeEnum,
	address: zp.str.nullable(),
	phone: zp.str.nullable(),
	isActive: zp.bool,
	...zc.AuditBasic.shape,
})
export type LocationDto = z.infer<typeof LocationDto>

// ─── Filter ───

export const LocationFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	type: LocationTypeEnum.optional(),
})
export type LocationFilterDto = z.infer<typeof LocationFilterDto>

// ─── Create / Update ───

export const LocationCreateDto = LocationMutationDto
export type LocationCreateDto = z.infer<typeof LocationCreateDto>

export const LocationUpdateDto = z.object({
	id: zp.id,
	...LocationMutationDto.shape,
})
export type LocationUpdateDto = z.infer<typeof LocationUpdateDto>
