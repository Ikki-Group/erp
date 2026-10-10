import { z } from 'zod'
import { LocationTypeEnum } from '../location.ts'
import { zp } from '../schema.ts'

// ─── Response: per-location operational counts (dashboard rollup) ───

export const InventoryLocationSummaryDto = z.object({
	id: zp.id,
	code: zp.str,
	name: zp.str,
	type: LocationTypeEnum,
	/** Balances below the material's minimum stock. */
	lowStockCount: zp.num,
	negativeStockCount: zp.num,
	/** In-transit transfers leaving or arriving at this location. */
	transfersInTransit: zp.num,
	/** Opnames not yet completed or cancelled (draft + in progress). */
	activeOpname: zp.num,
	draftReceivings: zp.num,
})
export type InventoryLocationSummaryDto = z.infer<typeof InventoryLocationSummaryDto>
