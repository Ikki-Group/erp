/**
 * Material Location Entity — Zod-based domain schema
 */

import { z, zc, zp } from '@ikki/api-contract/validation'

export const MaterialLocationEntity = z.object({
	...zc.RecordId.shape,
	materialId: zp.id,
	locationId: zp.id,

	// Per-location configuration
	minStock: zp.decimal,
	maxStock: zp.decimal.nullable(),
	reorderPoint: zp.decimal,

	// Current stock snapshot (maintained by inventory module)
	currentQty: zp.decimal,
	currentAvgCost: zp.decimal,
	currentValue: zp.decimal,

	...zc.AuditBasic.shape,
})

export type MaterialLocation = z.infer<typeof MaterialLocationEntity>
