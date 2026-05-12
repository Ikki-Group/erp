/**
 * UOM Entity — Zod-based domain schema
 */

import { z, zc, zp } from '@ikki/api-contract/validation'

export const UomEntity = z.object({
	...zc.RecordId.shape,
	code: zp.str,
	...zc.AuditBasic.shape,
})

export type Uom = z.infer<typeof UomEntity>
