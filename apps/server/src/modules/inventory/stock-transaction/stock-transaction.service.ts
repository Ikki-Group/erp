import { record } from '@elysiajs/opentelemetry'

import type { DbTx } from '@/infra/database'
import { withTransaction } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'

import type {
	AdjustmentTransactionDto,
	ProductionInTransactionDto,
	ProductionOutTransactionDto,
	PurchaseTransactionDto,
	SellTransactionDto,
	StockOpnameDto,
	StockTransactionDto,
	StockTransactionFilterDto,
	StockTransactionSelectDto,
	TransactionResultDto,
	TransferTransactionDto,
	UsageTransactionDto,
} from './stock-transaction.contract'
import type { IStockTransactionRepo } from './stock-transaction.repo'
import { StockExternalMovementService } from './sub-services/stock-external-movement.service'
import { StockHistoryService } from './sub-services/stock-history.service'
import { StockInternalMovementService } from './sub-services/stock-internal-movement.service'

type MaterialLocationPort = {
	findOne: (materialId: number, locationId: number) => Promise<{
		currentQty: string
		currentAvgCost: string
	}>
	updateCurrentStock: (
		materialId: number,
		locationId: number,
		data: { currentQty: number; currentAvgCost: number; currentValue: number },
		actorId: number,
		tx?: DbTx,
	) => Promise<void>
}

export class StockTransactionService {
	private readonly history: StockHistoryService
	private readonly external: StockExternalMovementService
	private readonly internal: StockInternalMovementService

	constructor(
		mLocationSvc: MaterialLocationPort,
		private readonly repo: IStockTransactionRepo,
	) {
		this.history = new StockHistoryService(this.repo)
		this.external = new StockExternalMovementService(this.repo, mLocationSvc)
		this.internal = new StockInternalMovementService(this.repo, mLocationSvc)
	}

	async handleList(
		filter: StockTransactionFilterDto,
	): Promise<WithPaginationResult<StockTransactionSelectDto>> {
		return record('StockTransactionService.handleList', async () =>
			this.history.handleList(filter),
		)
	}

	async handleDetail(id: number): Promise<StockTransactionDto> {
		return record('StockTransactionService.handleDetail', async () =>
			this.history.handleDetail(id),
		)
	}

	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('StockTransactionService.handleRemove', async () =>
			this.history.handleRemove(id, actorId),
		)
	}

	async handleHardRemove(id: number): Promise<{ id: number }> {
		return record('StockTransactionService.handleHardRemove', async () =>
			this.history.handleHardRemove(id),
		)
	}

	async handlePurchase(
		data: PurchaseTransactionDto,
		actorId: number,
	): Promise<TransactionResultDto> {
		return record('StockTransactionService.handlePurchase', async () =>
			withTransaction(this.repo.db, (tx) => this.external.purchase(data, actorId, tx)),
		)
	}

	async handleProductionIn(
		data: ProductionInTransactionDto,
		actorId: number,
	): Promise<TransactionResultDto> {
		return record('StockTransactionService.handleProductionIn', async () =>
			withTransaction(this.repo.db, (tx) => this.external.productionIn(data, actorId, tx)),
		)
	}

	async handleUsage(
		data: UsageTransactionDto,
		actorId: number,
	): Promise<TransactionResultDto> {
		return record('StockTransactionService.handleUsage', async () =>
			withTransaction(this.repo.db, (tx) => this.external.usage(data, actorId, tx)),
		)
	}

	async handleSell(
		data: SellTransactionDto,
		actorId: number,
	): Promise<TransactionResultDto> {
		return record('StockTransactionService.handleSell', async () =>
			withTransaction(this.repo.db, (tx) => this.external.sell(data, actorId, tx)),
		)
	}

	async handleProductionOut(
		data: ProductionOutTransactionDto,
		actorId: number,
	): Promise<TransactionResultDto> {
		return record('StockTransactionService.handleProductionOut', async () =>
			withTransaction(this.repo.db, (tx) => this.external.productionOut(data, actorId, tx)),
		)
	}

	async handleTransfer(
		data: TransferTransactionDto,
		actorId: number,
	): Promise<TransactionResultDto> {
		return record('StockTransactionService.handleTransfer', async () =>
			withTransaction(this.repo.db, (tx) => this.internal.transfer(data, actorId, tx)),
		)
	}

	async handleAdjustment(
		data: AdjustmentTransactionDto,
		actorId: number,
	): Promise<TransactionResultDto> {
		return record('StockTransactionService.handleAdjustment', async () =>
			withTransaction(this.repo.db, (tx) => this.internal.adjustment(data, actorId, tx)),
		)
	}

	async handleOpname(
		data: StockOpnameDto,
		actorId: number,
	): Promise<TransactionResultDto> {
		return record('StockTransactionService.handleOpname', async () =>
			withTransaction(this.repo.db, (tx) => this.internal.opname(data, actorId, tx)),
		)
	}

	async purchase(data: PurchaseTransactionDto, actorId: number, tx: DbTx): Promise<TransactionResultDto> {
		return this.external.purchase(data, actorId, tx)
	}

	async productionIn(data: ProductionInTransactionDto, actorId: number, tx: DbTx): Promise<TransactionResultDto> {
		return this.external.productionIn(data, actorId, tx)
	}

	async productionOut(data: ProductionOutTransactionDto, actorId: number, tx: DbTx): Promise<TransactionResultDto> {
		return this.external.productionOut(data, actorId, tx)
	}
}
