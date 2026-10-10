import { zRes } from '@ikki/contract/http'
import { InventoryLocationSummaryDto } from '@ikki/contract/inventory/summary'
import { z } from 'zod'

import { endpoint } from '@/config/endpoint.ts'

import { createResourceKeys, defineQuery } from '@/lib/api/index.ts'

// The visible locations depend on the active-location header, so partition per location.
const summaryKeys = createResourceKeys('inventory', 'summary', { locationScoped: true })

/** Per-location operational counts for every location the caller can read stock at. */
export const inventorySummary = defineQuery({
	method: 'get',
	url: endpoint.inventory.summary,
	result: zRes.ok(z.array(InventoryLocationSummaryDto)),
	queryKey: () => summaryKeys.list(),
})

export type { InventoryLocationSummaryDto }
