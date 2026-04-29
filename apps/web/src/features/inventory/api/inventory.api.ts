import { z } from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import {
	zc,
	zq,
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
} from '@/lib/validation'

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
	StockAlertFilterDto,
	StockAlertSelectDto,
	DashboardKpiFilterDto,
	DashboardKpiSelectDto,
} from '../dto'

export const stockSummaryApi = {
	byLocation: apiFactory({
		method: 'get',
		url: endpoint.inventory.summary.byLocation,
		params: StockSummaryFilterDto,
		result: createPaginatedResponseSchema(StockSummarySelectDto),
	}),
	ledger: apiFactory({
		method: 'get',
		url: endpoint.inventory.summary.ledger,
		params: StockLedgerFilterDto,
		result: createPaginatedResponseSchema(StockLedgerSelectDto),
	}),
	generate: apiFactory({
		method: 'post',
		url: endpoint.inventory.summary.generate,
		body: GenerateSummaryDto,
		result: createSuccessResponseSchema(z.object({ generatedCount: z.number() })),
		invalidates: [endpoint.inventory.summary.byLocation, endpoint.inventory.summary.ledger],
	}),
	remove: apiFactory({
		method: 'post',
		url: endpoint.inventory.summary.remove,
		params: zc.RecordId,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.inventory.summary.byLocation, endpoint.inventory.summary.ledger],
	}),
}

export const stockTransactionApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.inventory.transaction.list,
		params: StockTransactionFilterDto,
		result: createPaginatedResponseSchema(StockTransactionSelectDto),
	}),
	detail: apiFactory({
		method: 'get',
		url: endpoint.inventory.transaction.detail,
		params: zc.RecordId,
		result: createSuccessResponseSchema(StockTransactionDto),
	}),
	purchase: apiFactory({
		method: 'post',
		url: endpoint.inventory.transaction.purchase,
		body: PurchaseTransactionDto,
		result: createSuccessResponseSchema(TransactionResultDto),
		invalidates: [
			endpoint.inventory.transaction.list,
			endpoint.inventory.summary.byLocation,
			endpoint.inventoryAlert.count,
		],
	}),
	transfer: apiFactory({
		method: 'post',
		url: endpoint.inventory.transaction.transfer,
		body: TransferTransactionDto,
		result: createSuccessResponseSchema(TransactionResultDto),
		invalidates: [
			endpoint.inventory.transaction.list,
			endpoint.inventory.summary.byLocation,
			endpoint.inventoryAlert.count,
		],
	}),
	adjustment: apiFactory({
		method: 'post',
		url: endpoint.inventory.transaction.adjustment,
		body: AdjustmentTransactionDto,
		result: createSuccessResponseSchema(TransactionResultDto),
		invalidates: [
			endpoint.inventory.transaction.list,
			endpoint.inventory.summary.byLocation,
			endpoint.inventoryAlert.count,
		],
	}),
	opname: apiFactory({
		method: 'post',
		url: endpoint.inventory.transaction.opname,
		body: StockOpnameDto,
		result: createSuccessResponseSchema(TransactionResultDto),
		invalidates: [
			endpoint.inventory.transaction.list,
			endpoint.inventory.summary.byLocation,
			endpoint.inventoryAlert.count,
		],
	}),
	usage: apiFactory({
		method: 'post',
		url: endpoint.inventory.transaction.usage,
		body: UsageTransactionDto,
		result: createSuccessResponseSchema(TransactionResultDto),
		invalidates: [
			endpoint.inventory.transaction.list,
			endpoint.inventory.summary.byLocation,
			endpoint.inventoryAlert.count,
		],
	}),
	sell: apiFactory({
		method: 'post',
		url: endpoint.inventory.transaction.sell,
		body: SellTransactionDto,
		result: createSuccessResponseSchema(TransactionResultDto),
		invalidates: [
			endpoint.inventory.transaction.list,
			endpoint.inventory.summary.byLocation,
			endpoint.inventoryAlert.count,
		],
	}),
	productionIn: apiFactory({
		method: 'post',
		url: endpoint.inventory.transaction.productionIn,
		body: ProductionInTransactionDto,
		result: createSuccessResponseSchema(TransactionResultDto),
		invalidates: [
			endpoint.inventory.transaction.list,
			endpoint.inventory.summary.byLocation,
			endpoint.inventoryAlert.count,
		],
	}),
	productionOut: apiFactory({
		method: 'post',
		url: endpoint.inventory.transaction.productionOut,
		body: ProductionOutTransactionDto,
		result: createSuccessResponseSchema(TransactionResultDto),
		invalidates: [
			endpoint.inventory.transaction.list,
			endpoint.inventory.summary.byLocation,
			endpoint.inventoryAlert.count,
		],
	}),
	remove: apiFactory({
		method: 'post',
		url: endpoint.inventory.transaction.remove,
		params: zc.RecordId,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.inventory.transaction.list, endpoint.inventory.summary.byLocation],
	}),
}

export const stockAlertApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.inventoryAlert.list,
		params: StockAlertFilterDto.extend(zq.pagination.shape),
		result: createPaginatedResponseSchema(StockAlertSelectDto),
	}),
	count: apiFactory({
		method: 'get',
		url: endpoint.inventoryAlert.count,
		params: StockAlertFilterDto,
		result: createSuccessResponseSchema(z.object({ count: z.number() })),
	}),
}

export const stockDashboardApi = {
	kpi: apiFactory({
		method: 'get',
		url: endpoint.inventoryDashboard.kpi,
		params: DashboardKpiFilterDto,
		result: createSuccessResponseSchema(DashboardKpiSelectDto),
	}),
}
