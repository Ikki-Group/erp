/**
 * Material Read Schemas — Query result schemas
 */

import { z, zp } from 'zod'

import { zc } from '@/shared/schema'

/* -------------------------------- BASE -------------------------------- */

export const MaterialTypeSchema = z.enum(['raw', 'semi', 'packaging'])
export type MaterialTypeSchema = z.infer<typeof MaterialTypeSchema>

export const MaterialReadSchema = z.object({
	id: zp.id,
	name: zp.str,
	description: zp.strNullable,
	sku: zp.str,
	type: MaterialTypeSchema,
	categoryId: zp.id.nullable(),
	baseUomId: zp.id,
	...zc.AuditBasic.shape,
})
export type MaterialReadSchema = z.infer<typeof MaterialReadSchema>

export const MaterialReadDetailSchema = MaterialReadSchema
export type MaterialReadDetailSchema = z.infer<typeof MaterialReadDetailSchema>

/* -------------------------------- WITH RELATIONS -------------------------------- */

export const MaterialCategoryReadSchema = z.object({
	id: zp.id,
	name: zp.str,
	description: zp.strNullable,
	parentId: zp.id.nullable(),
	...zc.AuditBasic.shape,
})
export type MaterialCategoryReadSchema = z.infer<typeof MaterialCategoryReadSchema>

export const MaterialConversionReadSchema = z.object({
	id: zp.id,
	materialId: zp.id,
	uomId: zp.id,
	toBaseFactor: zp.str,
	...zc.AuditBasic.shape,
})
export type MaterialConversionReadSchema = z.infer<typeof MaterialConversionReadSchema>

export const UomReadSchema = z.object({
	id: zp.id,
	code: zp.str,
	name: zp.str,
	description: zp.strNullable,
	...zc.AuditBasic.shape,
})
export type UomReadSchema = z.infer<typeof UomReadSchema>

export const LocationReadSchema = z.object({
	id: zp.id,
	name: zp.str,
	code: zp.str,
	address: zp.strNullable,
	type: zp.str,
	...zc.AuditBasic.shape,
})
export type LocationReadSchema = z.infer<typeof LocationReadSchema>

export const MaterialReadWithRelationsSchema = z.object({
	// Material fields
	id: zp.id,
	name: zp.str,
	description: zp.strNullable,
	sku: zp.str,
	type: MaterialTypeSchema,
	categoryId: zp.id.nullable(),
	baseUomId: zp.id,
	...zc.AuditBasic.shape,
	// Category
	category: MaterialCategoryReadSchema.nullable(),
	// Conversions with UOM
	conversions: z.array(
		z.object({
			...MaterialConversionReadSchema.shape,
			uom: UomReadSchema,
		}),
	),
	// Locations
	locations: z.array(LocationReadSchema),
})
export type MaterialReadWithRelationsSchema = z.infer<typeof MaterialReadWithRelationsSchema>

/* -------------------------------- FILTER -------------------------------- */

export const MaterialReadFilterSchema = z.object({
	pagination: z.object({
		limit: zp.id,
		offset: zp.id,
	}),
	search: zp.str.optional(),
	type: MaterialTypeSchema.optional(),
	categoryId: zp.id.optional(),
	locationIds: z.array(zp.id).optional(),
	excludeLocationIds: z.array(zp.id).optional(),
})
export type MaterialReadFilterSchema = z.infer<typeof MaterialReadFilterSchema>
