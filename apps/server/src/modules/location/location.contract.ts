import { z } from 'zod'

import { defineContract } from '@/shared/contract/define-contract'
import { zc, zp, zq } from '@/shared/schema'

/* --------------------------------- ENTITY --------------------------------- */

/** Types of operational locations. */
export const LocationTypeEnum = z.enum([
	/** Retail storefront for customers. */
	'store',
	/** Storage facility for inventory. */
	'warehouse',
])
export type LocationTypeEnum = z.infer<typeof LocationTypeEnum>

export const LocationDto = z.object({
	id: zp.id,
	code: zp.str,
	name: zp.str,
	type: LocationTypeEnum,
	description: zp.str.nullable(),
	address: zp.str.nullable(),
	phone: zp.str.nullable(),
	isActive: zp.bool,
	...zc.AuditBasic.shape,
})
export type LocationDto = z.infer<typeof LocationDto>

/* ---------------------------------- HTTP ---------------------------------- */

export const LocationFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	type: LocationTypeEnum.optional(),
})
export type LocationFilterDto = z.infer<typeof LocationFilterDto>

// Reusable mutation shape
const LocationMutationDto = z.object({
	code: zc.strTrim,
	name: zc.strTrim.min(3).max(100),
	type: LocationTypeEnum,
	description: zc.strTrimNullable,
	address: zc.strTrimNullable,
	phone: zc.strTrimNullable,
	isActive: zp.bool.default(true),
})

export const LocationCreateDto = LocationMutationDto
export type LocationCreateDto = z.infer<typeof LocationCreateDto>

export const LocationUpdateDto = z.object({
	id: zp.id,
	...LocationMutationDto.shape,
})
export type LocationUpdateDto = z.infer<typeof LocationUpdateDto>

/* -------------------------------- CONTRACT -------------------------------- */

/**
 * Single source of truth for the Location HTTP surface.
 * Drives both the Elysia route wiring and the web codegen.
 */
export const locationContract = defineContract({
	feature: 'location',
	entity: 'location',
	prefix: '/location',
	dtoSource: 'location/location.contract.ts',
	dtos: { LocationDto, LocationFilterDto, LocationCreateDto, LocationUpdateDto },
	endpoints: {
		list: { get: '/list', query: LocationFilterDto, ok: [LocationDto] },
		detail: { get: '/detail', query: zc.RecordId, ok: LocationDto },
		create: { post: '/create', body: LocationCreateDto, ok: zc.RecordId },
		update: { put: '/update', body: LocationUpdateDto, ok: zc.RecordId },
		remove: { delete: '/remove', body: zc.RecordId, ok: zc.RecordId },
	},
})
