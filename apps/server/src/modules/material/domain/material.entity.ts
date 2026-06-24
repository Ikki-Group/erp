/**
 * Material Entity — Zod-based domain schema
 *
 * Single source of truth for the material data shape.
 * Used by repos (return type) and services (working type).
 */

import { z } from 'zod'

import { zc, zp } from '@/shared/schema'

/* ---------------------------------- ENUM ---------------------------------- */

export const MaterialTypeDto = z.enum(['raw', 'semi', 'packaging'])
export type MaterialType = z.infer<typeof MaterialTypeDto>

/* --------------------------------- ENTITY --------------------------------- */

export const MaterialEntity = z.object({
	...zc.RecordId.shape,
	name: zp.str,
	description: zp.strNullable,
	sku: zp.str,
	type: MaterialTypeDto,
	categoryId: zp.id,
	baseUomId: zp.id,
	...zc.AuditBasic.shape,
})

export type Material = z.infer<typeof MaterialEntity>
