import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema'

/* --------------------------------- ENTITY --------------------------------- */

/**
 * Types of operational locations.
 *
 * Business rules by type:
 * - `store`     — retail storefront. Supports sales, stock management, and customer-facing operations.
 * - `warehouse` — storage facility. Supports stock management only (no direct sales).
 *
 * Enforcement: the sales module rejects transactions targeting a warehouse-type location.
 * The location module itself is type-agnostic — it only stores the classification.
 */
export const LocationTypeEnum = z.enum([
	/** Retail storefront — supports sales + stock. */
	'store',
	/** Storage facility — stock management only, no sales. */
	'warehouse',
])
export type LocationTypeEnum = z.infer<typeof LocationTypeEnum>

/**
 * Location entity schema (output/response shape).
 *
 * Represents a physical operational site. Central anchor for LBAC — users are
 * granted roles per location via user_assignments.
 *
 * Key business rules:
 * - `code` is immutable after creation (stable identifier for reporting/seed).
 * - `isActive = false` prevents new references (assignments, stock transactions, sales)
 *   but does NOT cascade-delete existing ones. Caller must clean up explicitly.
 * - Both `code` and `name` are globally unique (enforced by DB + service layer).
 */
export const LocationSchema = z.object({
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
export type LocationSchema = z.infer<typeof LocationSchema>

/* ---------------------------------- HTTP ---------------------------------- */

export const LocationFilterSchema = z.object({
	...zq.pagination.shape,
	q: zq.search,
	type: LocationTypeEnum.optional(),
})
export type LocationFilterSchema = z.infer<typeof LocationFilterSchema>

// Reusable mutation shape (private — never exported)
const LocationMutationSchema = z.object({
	code: zc.strTrim,
	name: zc.strTrim.min(3).max(100),
	type: LocationTypeEnum,
	description: zc.strTrimNullable,
	address: zc.strTrimNullable,
	phone: zc.strTrimNullable,
	isActive: zp.bool.default(true),
})

/** Create schema — includes `code` (set once, never changed). */
export const LocationCreateSchema = LocationMutationSchema
export type LocationCreateSchema = z.infer<typeof LocationCreateSchema>

/**
 * Update schema — `code` is excluded (immutable after creation).
 * Only mutable fields are exposed for update.
 */
export const LocationUpdateSchema = z.object({
	id: zp.id,
	name: zc.strTrim.min(3).max(100),
	type: LocationTypeEnum,
	description: zc.strTrimNullable,
	address: zc.strTrimNullable,
	phone: zc.strTrimNullable,
	isActive: zp.bool.default(true),
})
export type LocationUpdateSchema = z.infer<typeof LocationUpdateSchema>
