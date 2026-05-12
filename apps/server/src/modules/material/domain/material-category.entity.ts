/**
 * Material Category Entity — Zod-based domain schema
 */

import { z, zc, zp } from '@ikki/api-contract/validation'

export const MaterialCategoryEntity = z.object({
	...zc.RecordId.shape,
	name: zp.str,
	description: zp.strNullable,
	...zc.AuditBasic.shape,
})

export type MaterialCategory = z.infer<typeof MaterialCategoryEntity>
