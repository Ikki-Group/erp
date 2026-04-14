import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zPaginationDto,
	zRecordIdDto,
} from '@/lib/zod'

import {
	AdjustmentTransactionDto,
	GenerateSummaryDto,
	PurchaseTransactionDto,
	StockLedgerFilterDto,
	StockLedgerSelectDto,
	StockSummaryFilterDto,
	StockSummarySelectDto,
	StockTransactionDto,
	StockTransactionFilterDto,
	StockTransactionSelectDto,
	StockOpnameDto,
	TransactionResultDto,
	TransferTransactionDto,
	UsageTransactionDto,
	SellTransactionDto,
	ProductionInTransactionDto,
	ProductionOutTransactionDto,
	stockAlertFilterSchema,
	stockAlertSelectSchema,
	dashboardKpiFilterSchema,
	dashboardKpiSelectSchema,
} from '../dto'

import { z } from 'zod'

export const stockSummaryApi = {
	byLocation: apiFactory({
		method: 'get',
		url: endpoint.inventory.summary.byLocation,
		params: z.object({ ...zPaginationDto.shape, ...StockSummaryFilterDto.shape }),
		result: createPaginatedResponseSchema(StockSummarySelectDto),
	}),
	ledger: apiFactory({
		method: 'get',
		url: endpoint.inventory.summary.ledger,
		params: z.object({ ...zPaginationDto.shape, ...StockLedgerFilterDto.shape }),
		result: createPaginatedResponseSchema(StockLedgerSelectDto),
	}),
	generate: apiFactory({
		method: 'post',
		url: endpoint.inventory.summary.generate,
		body: GenerateSummaryDto,
		result: createSuccessResponseSchema(z.object({ count: z.number() })),
	}),
}

export const stockTransactionApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.inventory.transaction.list,
		params: z.object({ ...zPaginationDto.shape, ...StockTransactionFilterDto.shape }),
		result: createPaginatedResponseSchema(StockTransactionSelectDto),
	}),
	detail: apiFactory({
		method: 'get',
		url: endpoint.inventory.transaction.detail,
		params: zRecordIdDto,
		result: createSuccessResponseSchema(StockTransactionDto),
	}),
	purchase: apiFactory({
		method: 'post',
		url: endpoint.inventory.transaction.purchase,
		body: PurchaseTransactionDto,
		result: createSuccessResponseSchema(TransactionResultDto),
	}),
	transfer: apiFactory({
		method: 'post',
		url: endpoint.inventory.transaction.transfer,
		body: TransferTransactionDto,
		result: createSuccessResponseSchema(TransactionResultDto),
	}),
	adjustment: apiFactory({
		method: 'post',
		url: endpoint.inventory.transaction.adjustment,
		body: AdjustmentTransactionDto,
		result: createSuccessResponseSchema(TransactionResultDto),
	}),
	opname: apiFactory({
		method: 'post',
		url: endpoint.inventory.transaction.opname,
		body: StockOpnameDto,
		result: createSuccessResponseSchema(TransactionResultDto),
	}),
	usage: apiFactory({
		method: 'post',
		url: endpoint.inventory.transaction.usage,
		body: UsageTransactionDto,
		result: createSuccessResponseSchema(TransactionResultDto),
	}),
	sell: apiFactory({
		method: 'post',
		url: endpoint.inventory.transaction.sell,
		body: SellTransactionDto,
		result: createSuccessResponseSchema(TransactionResultDto),
	}),
	productionIn: apiFactory({
		method: 'post',
		url: endpoint.inventory.transaction.productionIn,
		body: ProductionInTransactionDto,
		result: createSuccessResponseSchema(TransactionResultDto),
	}),
	productionOut: apiFactory({
		method: 'post',
		url: endpoint.inventory.transaction.productionOut,
		body: ProductionOutTransactionDto,
		result: createSuccessResponseSchema(TransactionResultDto),
	}),
	remove: apiFactory({
		method: 'post',
		url: endpoint.inventory.transaction.remove,
		params: zRecordIdDto,
		result: createSuccessResponseSchema(zRecordIdDto),
	}),
}

export const stockAlertApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.inventoryAlert.list,
		params: z.object({ ...zPaginationDto.shape, ...stockAlertFilterSchema.shape }),
		result: createPaginatedResponseSchema(stockAlertSelectSchema),
	}),
	count: apiFactory({
		method: 'get',
		url: endpoint.inventoryAlert.count,
		params: stockAlertFilterSchema,
		result: createSuccessResponseSchema(z.object({ count: z.number() })),
	}),
}

export const stockDashboardApi = {
	kpi: apiFactory({
		method: 'get',
		url: endpoint.inventoryDashboard.kpi,
		params: dashboardKpiFilterSchema,
		result: createSuccessResponseSchema(dashboardKpiSelectSchema),
	}),
}
