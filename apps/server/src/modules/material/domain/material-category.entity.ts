/**
 * Material Category Entity — Zod-based domain schema
 */

import { z } from 'zod'

import { zc, zp } from '@/shared/schema'

export const MaterialCategoryEntity = z.object({
	...zc.RecordId.shape,
	name: zp.str,
	description: zp.strNullable,
	...zc.AuditBasic.shape,
})

export type MaterialCategory = z.infer<typeof MaterialCategoryEntity>
