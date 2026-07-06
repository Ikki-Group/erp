import { Elysia } from 'elysia'

import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import type { MaterialModule } from '@/modules/material'

import { createStockAlertModule } from './stock-alert/stock-alert.module'
import { createStockAlertRoute } from './stock-alert/stock-alert.route'
import { createStockDashboardModule } from './stock-dashboard/stock-dashboard.module'
import { createStockDashboardRoute } from './stock-dashboard/stock-dashboard.route'
import { createStockSummaryModule } from './stock-summary/stock-summary.module'
import { initStockSummaryRoute } from './stock-summary/stock-summary.route'
import { createStockTransactionModule } from './stock-transaction/stock-transaction.module'
import { initStockTransactionRoute } from './stock-transaction/stock-transaction.route'
import { createStockTransferModule } from './stock-transfer/stock-transfer.module'
import { initStockTransferRoute } from './stock-transfer/stock-transfer.route'

export interface InventoryModuleDeps {
	material: MaterialModule
}

export interface InventoryModule {
	transaction: ReturnType<typeof createStockTransactionModule>
	summary: ReturnType<typeof createStockSummaryModule>
	alert: ReturnType<typeof createStockAlertModule>
	dashboard: ReturnType<typeof createStockDashboardModule>
	stockTransfer: ReturnType<typeof createStockTransferModule>
}

export function createInventoryModule(
	db: DbClient,
	cacheClient: CacheClient,
	deps: InventoryModuleDeps,
): InventoryModule {
	const transaction = createStockTransactionModule(db, { location: deps.material.location })
	const summary = createStockSummaryModule(db, cacheClient, { location: deps.material.location })
	const alert = createStockAlertModule(db, cacheClient)
	const dashboard = createStockDashboardModule(db, cacheClient)
	const stockTransfer = createStockTransferModule(db, cacheClient)

	return { transaction, summary, alert, dashboard, stockTransfer }
}

export function createInventoryRoute(m: InventoryModule) {
	return new Elysia({ prefix: '/inventory' })
		.use(initStockTransactionRoute(m.transaction))
		.use(initStockSummaryRoute(m.summary))
		.use(createStockAlertRoute(m.alert))
		.use(createStockDashboardRoute(m.dashboard))
		.use(initStockTransferRoute(m.stockTransfer))
}

export type { StockTransactionService } from './stock-transaction/stock-transaction.service'

export { StockAlertFilterDto, StockAlertSelectDto } from './stock-alert/stock-alert.contract'
export {
	DashboardKpiFilterDto,
	DashboardKpiSelectDto,
} from './stock-dashboard/stock-dashboard.contract'
export { StockSummaryDto, StockSummaryFilterDto } from './stock-summary/stock-summary.contract'
export {
	StockTransactionDto,
	StockTransactionFilterDto,
	StockTransactionSelectDto,
	TransactionTypeEnum,
	type TransactionType,
	PurchaseTransactionDto,
	TransferTransactionDto,
	AdjustmentTransactionDto,
	UsageTransactionDto,
	SellTransactionDto,
	ProductionInTransactionDto,
	ProductionOutTransactionDto,
	TransactionResultDto,
	StockOpnameDto,
} from './stock-transaction/stock-transaction.contract'
export {
	StockTransferDto,
	StockTransferCreateDto,
	StockTransferUpdateDto,
	StockTransferFilterDto,
} from './stock-transfer/stock-transfer.contract'
