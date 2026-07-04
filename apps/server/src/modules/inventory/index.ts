import { Elysia } from 'elysia'

import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import type { MaterialModule } from '@/modules/material'

import { createStockAlertModule } from './stock-alert/stock-alert.module'
import { createStockAlertRoute } from './stock-alert/stock-alert.route'
import { createStockDashboardModule } from './stock-dashboard/stock-dashboard.module'
import { createStockDashboardRoute } from './stock-dashboard/stock-dashboard.route'
import { StockSummaryRepo } from './stock-summary/stock-summary.repo'
import { initStockSummaryRoute } from './stock-summary/stock-summary.route'
import { StockSummaryService } from './stock-summary/stock-summary.service'
import { StockTransactionRepo } from './stock-transaction/stock-transaction.repo'
import { initStockTransactionRoute } from './stock-transaction/stock-transaction.route'
import { StockTransactionService } from './stock-transaction/stock-transaction.service'
import { StockTransferRepo } from './stock-transfer/stock-transfer.repo'
import { initStockTransferRoute } from './stock-transfer/stock-transfer.route'
import { StockTransferService } from './stock-transfer/stock-transfer.service'

interface InventoryServiceModuleDeps {
	material: MaterialModule
}

export class InventoryServiceModule {
	public readonly transaction: StockTransactionService
	public readonly summary: StockSummaryService
	public readonly alert: ReturnType<typeof createStockAlertModule>
	public readonly dashboard: ReturnType<typeof createStockDashboardModule>
	public readonly stockTransfer: StockTransferService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
		private readonly deps: InventoryServiceModuleDeps,
	) {
		const transactionRepo = new StockTransactionRepo(this.db)
		const summaryRepo = new StockSummaryRepo(this.db)
		const stockTransferRepo = new StockTransferRepo(this.db)

		this.transaction = new StockTransactionService(this.deps.material.location, transactionRepo)
		this.summary = new StockSummaryService(
			summaryRepo,
			this.deps.material.location,
			this.cacheClient,
		)
		this.alert = createStockAlertModule(this.db, this.cacheClient)
		this.dashboard = createStockDashboardModule(this.db, this.cacheClient)
		this.stockTransfer = new StockTransferService(stockTransferRepo, this.cacheClient)
	}
}

export function initInventoryRouteModule(s: InventoryServiceModule) {
	return new Elysia({ prefix: '/inventory' })
		.use(initStockTransactionRoute(s.transaction))
		.use(initStockSummaryRoute(s.summary))
		.use(createStockAlertRoute(s.alert))
		.use(createStockDashboardRoute(s.dashboard))
		.use(initStockTransferRoute(s.stockTransfer))
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
