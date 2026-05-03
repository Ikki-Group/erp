import { z } from 'zod'

import { zc, zp, zq } from '@/lib/validation'

/* ---------------------------------- ENTITY ---------------------------------- */

export const StockSummaryDto = z.object({
	...zc.RecordId.shape,
	materialId: zp.id,
	locationId: zp.id,
	date: zp.date,

	// Opening balance
	openingQty: zp.decimal,
	openingAvgCost: zp.decimal,
	openingValue: zp.decimal,

	// Movements
	purchaseQty: zp.decimal,
	purchaseValue: zp.decimal,
	transferInQty: zp.decimal,
	transferInValue: zp.decimal,
	transferOutQty: zp.decimal,
	transferOutValue: zp.decimal,
	adjustmentQty: zp.decimal,
	adjustmentValue: zp.decimal,
	usageQty: zp.decimal,
	usageValue: zp.decimal,
	productionInQty: zp.decimal,
	productionInValue: zp.decimal,
	productionOutQty: zp.decimal,
	productionOutValue: zp.decimal,
	sellQty: zp.decimal,
	sellValue: zp.decimal,

	// Closing balance
	closingQty: zp.decimal,
	closingAvgCost: zp.decimal,
	closingValue: zp.decimal,
	...zc.AuditBasic.shape,
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
	...zq.pagination.shape,
	locationId: zq.id,
	materialId: zq.id.optional(),
	dateFrom: z.coerce.date(),
	dateTo: z.coerce.date(),
})

export type StockSummaryFilterDto = z.infer<typeof StockSummaryFilterDto>

export const StockLedgerFilterDto = z.object({
	...zq.pagination.shape,
	locationId: zq.id.optional(),
	materialId: zq.id.optional(),
	q: zq.search,
	dateFrom: z.coerce.date(),
	dateTo: z.coerce.date(),
})

export type StockLedgerFilterDto = z.infer<typeof StockLedgerFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

/** Generate daily summary for a specific date + location */
export const GenerateSummaryDto = z.object({
	locationId: zp.id,
	date: zp.date,
})

export type GenerateSummaryDto = z.infer<typeof GenerateSummaryDto>

/* --------------------------------- LEDGER --------------------------------- */

export const StockLedgerSelectDto = z.object({
	materialId: zp.id,
	materialName: zp.str,
	materialSku: zp.str,
	baseUomCode: zp.str,

	openingQty: zp.decimal,

	purchaseQty: zp.decimal,
	transferInQty: zp.decimal,
	transferOutQty: zp.decimal,
	sellQty: zp.decimal,
	adjustmentQty: zp.decimal,
	usageQty: zp.decimal,
	productionInQty: zp.decimal,
	productionOutQty: zp.decimal,

	closingQty: zp.decimal,
	closingValue: zp.decimal,
	closingAvgCost: zp.decimal,
})

export type StockLedgerSelectDto = z.infer<typeof StockLedgerSelectDto>
