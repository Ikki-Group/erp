import { z } from 'zod'

import { zc, zp, zq } from '@/lib/validation/index.ts'

// ─── Enums ───

export const LocationTypeEnum = z.enum(['store', 'warehouse'])
export type LocationTypeEnum = z.infer<typeof LocationTypeEnum>

export const LOCATION_TYPE_OPTIONS = [
	{ label: 'Toko', value: 'store' },
	{ label: 'Gudang', value: 'warehouse' },
] as const

export const LOCATION_STATUS_OPTIONS = [
	{ label: 'Aktif', value: '1' },
	{ label: 'Nonaktif', value: '0' },
] as const

export function parseLocationStatus(value: string | undefined): 0 | 1 | undefined {
	return value === '1' ? 1 : value === '0' ? 0 : undefined
}

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
	isActive: z.coerce.number().int().min(0).max(1).optional(),
})
export type LocationFilterDto = z.infer<typeof LocationFilterDto>

// ─── Create ───

export const LocationCreateDto = z.object({
	code: zc.strTrim,
	name: zc.strTrim.min(3).max(100),
	type: LocationTypeEnum,
	address: zc.strTrimNullable.optional(),
	phone: zc.strTrimNullable.optional(),
	isActive: zp.bool.optional().default(true),
})
export type LocationCreateDto = z.infer<typeof LocationCreateDto>

// ─── Update ───

export const LocationUpdateDto = z.object({
	id: zp.id,
	code: zc.strTrim,
	name: zc.strTrim.min(3).max(100),
	type: LocationTypeEnum,
	address: zc.strTrimNullable.optional(),
	phone: zc.strTrimNullable.optional(),
	isActive: zp.bool.optional().default(true),
})
export type LocationUpdateDto = z.infer<typeof LocationUpdateDto>
