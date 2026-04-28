import z from 'zod'

import { zp, zc, zq } from '@/lib/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const StockSummaryDto = z.object({
	...zc.RecordId.shape,
	materialId: zp.id,
	locationId: zp.id,
	date: zp.date,

	// Opening balance
	openingQty: zp.num,
	openingAvgCost: zp.num,
	openingValue: zp.num,

	// Movements
	purchaseQty: zp.num,
	purchaseValue: zp.num,
	transferInQty: zp.num,
	transferInValue: zp.num,
	transferOutQty: zp.num,
	transferOutValue: zp.num,
	adjustmentQty: zp.num,
	adjustmentValue: zp.num,
	usageQty: zp.num,
	usageValue: zp.num,
	productionInQty: zp.num,
	productionInValue: zp.num,
	productionOutQty: zp.num,
	productionOutValue: zp.num,
	sellQty: zp.num,
	sellValue: zp.num,

	// Closing balance
	closingQty: zp.num,
	closingAvgCost: zp.num,
	closingValue: zp.num,
	...zc.AuditFull.shape,
})

export type StockSummaryDto = z.infer<typeof StockSummaryDto>

/* --------------------------------- RESULT --------------------------------- */

/** Summary enriched with material info for display */
export const StockSummarySelectDto = StockSummaryDto.extend({
	materialName: zp.str,
	materialSku: zp.str,
})

export type StockSummarySelectDto = z.infer<typeof StockSummarySelectDto>

/* --------------------------------- FILTER --------------------------------- */

export const StockSummaryFilterDto = z.object({
	locationId: zq.id,
	materialId: zq.id.optional(),
	dateFrom: z.coerce.date(),
	dateTo: z.coerce.date(),
})

export type StockSummaryFilterDto = z.infer<typeof StockSummaryFilterDto>

export const StockLedgerFilterDto = z.object({
	locationId: zq.id.optional(),
	materialId: zq.id.optional(),
	q: zq.search,
	dateFrom: z.coerce.date(),
	dateTo: z.coerce.date(),
})

export type StockLedgerFilterDto = z.infer<typeof StockLedgerFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

/** Generate daily summary for a specific date + location */
export const GenerateSummaryDto = z.object({ locationId: zp.id, date: zp.date })

export type GenerateSummaryDto = z.infer<typeof GenerateSummaryDto>

/* --------------------------------- LEDGER --------------------------------- */

export const StockLedgerSelectDto = z.object({
	materialId: zp.id,
	materialName: zp.str,
	materialSku: zp.str,
	baseUomCode: zp.str,

	openingQty: zp.num,

	purchaseQty: zp.num,
	transferInQty: zp.num,
	transferOutQty: zp.num,
	sellQty: zp.num,
	adjustmentQty: zp.num,
	usageQty: zp.num,
	productionInQty: zp.num,
	productionOutQty: zp.num,

	closingQty: zp.num,
	closingValue: zp.num,
	closingAvgCost: zp.num,
})

export type StockLedgerSelectDto = z.infer<typeof StockLedgerSelectDto>
