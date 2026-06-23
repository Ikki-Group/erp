/**
 * Material Conversion Entity — Zod-based domain schema
 */

import { z } from 'zod'

import { zc, zp } from '@/shared/schema'

export const MaterialConversionEntity = z.object({
	...zc.RecordId.shape,
	materialId: zp.id,
	uomId: zp.id,
	toBaseFactor: zp.decimal,
	...zc.AuditBasic.shape,
})

export type MaterialConversion = z.infer<typeof MaterialConversionEntity>
