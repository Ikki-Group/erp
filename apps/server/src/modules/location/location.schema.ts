import { z } from 'zod'

import { zc, zp, zq } from '@/shared/validation'

/* ---------------------------------- BASE ---------------------------------- */

/** Types of operational locations. */
export const LocationTypeEnum = z.enum([
	/** Retail storefront for customers. */
	'store',
	/** Storage facility for inventory. */
	'warehouse',
])
export type LocationTypeEnum = z.infer<typeof LocationTypeEnum>

export const LocationSchema = z.object({
	id: zp.id,
	code: zp.str.nullable(),
	name: zp.str,
	type: LocationTypeEnum,
	description: zp.str.nullable(),
	address: zp.str.nullable(),
	phone: zp.str.nullable(),
	isActive: zp.bool,
	...zc.AuditBasic.shape,
})
export type LocationSchema = z.infer<typeof LocationSchema>

/* -------------------------------- MUTATION -------------------------------- */

export const LocationMutationSchema = z.object({
	code: zc.strTrimNullable.optional(),
	name: zc.strTrim.min(3).max(100),
	type: LocationTypeEnum,
	description: zc.strTrimNullable,
	address: zc.strTrimNullable,
	phone: zc.strTrimNullable,
	isActive: zp.bool.default(true),
})
export type LocationMutationSchema = z.infer<typeof LocationMutationSchema>

/* --------------------------------- FILTER --------------------------------- */

export const LocationFilterSchema = z.object({
	...zq.pagination.shape,
	q: zq.search,
	type: LocationTypeEnum.optional(),
})
export type LocationFilterSchema = z.infer<typeof LocationFilterSchema>
