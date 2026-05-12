/**
 * Material Conversion Entity — Zod-based domain schema
 */

import { z, zc, zp } from '@ikki/api-contract/validation'

export const MaterialConversionEntity = z.object({
	...zc.RecordId.shape,
	materialId: zp.id,
	uomId: zp.id,
	toBaseFactor: zp.decimal,
	...zc.AuditBasic.shape,
})

export type MaterialConversion = z.infer<typeof MaterialConversionEntity>
