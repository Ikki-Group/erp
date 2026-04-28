import { record } from '@elysiajs/opentelemetry'

import type { DbTx } from '@/core/database'
import type { WithPaginationResult } from '@/core/utils/pagination'

import { db } from '@/db'

import type { MaterialLocationService } from '@/modules/material'

import type {
	AdjustmentTransactionDto,
	PurchaseTransactionDto,
	SellTransactionDto,
	StockOpnameDto,
	StockTransactionDto,
	StockTransactionFilterDto,
	StockTransactionSelectDto,
	TransactionResultDto,
	TransferTransactionDto,
	UsageTransactionDto,
	ProductionInTransactionDto,
	ProductionOutTransactionDto,
} from './stock-transaction.dto'
import { StockExternalMovementService } from './sub-services/stock-external-movement.service'
import { StockHistoryService } from './sub-services/stock-history.service'
import { StockInternalMovementService } from './sub-services/stock-internal-movement.service'

/**
 * StockTransactionService (Layer 2)
 * Primary facade for all inventory stock movements and history.
 * Modularized into sub-services to comply with < 300 line limit.
 */
export class StockTransactionService {
	private readonly history: StockHistoryService
	private readonly external: StockExternalMovementService
	private readonly internal: StockInternalMovementService

	constructor(mLocationSvc: MaterialLocationService) {
		this.history = new StockHistoryService()
		this.external = new StockExternalMovementService(mLocationSvc)
		this.internal = new StockInternalMovementService(mLocationSvc)
	}

	/* --------------------------------- HANDLER -------------------------------- */

	/* ─── READ OPERATIONS ────────────────────────────────────────────────────── */

	async handleList(
		filter: StockTransactionFilterDto,
	): Promise<WithPaginationResult<StockTransactionSelectDto>> {
		return record('StockTransactionService.handleList', async () => {
			return this.history.handleList(filter)
		})
	}

	async handleDetail(id: number): Promise<StockTransactionDto> {
		return record('StockTransactionService.handleDetail', async () => {
			return this.history.handleDetail(id)
		})
	}

	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('StockTransactionService.handleRemove', async () => {
			return this.history.handleRemove(id, actorId)
		})
	}

	async handleHardRemove(id: number): Promise<{ id: number }> {
		return record('StockTransactionService.handleHardRemove', async () => {
			return this.history.handleHardRemove(id)
		})
	}

	/* ─── WRITE OPERATIONS: EXTERNAL ─────────────────────────────────────────── */

	async handlePurchase(
		data: PurchaseTransactionDto,
		actorId: number,
		tx: DbTx | typeof db = db,
	): Promise<TransactionResultDto> {
		return record('StockTransactionService.handlePurchase', async () => {
			return this.external.handlePurchase(data, actorId, tx)
		})
	}

	async handleProductionIn(
		data: ProductionInTransactionDto,
		actorId: number,
		tx: DbTx | typeof db = db,
	): Promise<TransactionResultDto> {
		return record('StockTransactionService.handleProductionIn', async () => {
			return this.external.handleProductionIn(data, actorId, tx)
		})
	}

	async handleUsage(
		data: UsageTransactionDto,
		actorId: number,
		tx: DbTx | typeof db = db,
	): Promise<TransactionResultDto> {
		return record('StockTransactionService.handleUsage', async () => {
			return this.external.handleUsage(data, actorId, tx)
		})
	}

	async handleSell(
		data: SellTransactionDto,
		actorId: number,
		tx: DbTx | typeof db = db,
	): Promise<TransactionResultDto> {
		return record('StockTransactionService.handleSell', async () => {
			return this.external.handleSell(data, actorId, tx)
		})
	}

	async handleProductionOut(
		data: ProductionOutTransactionDto,
		actorId: number,
		tx: DbTx | typeof db = db,
	): Promise<TransactionResultDto> {
		return record('StockTransactionService.handleProductionOut', async () => {
			return this.external.handleProductionOut(data, actorId, tx)
		})
	}

	/* ─── WRITE OPERATIONS: INTERNAL ─────────────────────────────────────────── */

	async handleTransfer(
		data: TransferTransactionDto,
		actorId: number,
		tx: DbTx | typeof db = db,
	): Promise<TransactionResultDto> {
		return record('StockTransactionService.handleTransfer', async () => {
			return this.internal.handleTransfer(data, actorId, tx)
		})
	}

	async handleAdjustment(
		data: AdjustmentTransactionDto,
		actorId: number,
		tx: DbTx | typeof db = db,
	): Promise<TransactionResultDto> {
		return record('StockTransactionService.handleAdjustment', async () => {
			return this.internal.handleAdjustment(data, actorId, tx)
		})
	}

	async handleOpname(
		data: StockOpnameDto,
		actorId: number,
		tx: DbTx | typeof db = db,
	): Promise<TransactionResultDto> {
		return record('StockTransactionService.handleOpname', async () => {
			return this.internal.handleOpname(data, actorId, tx)
		})
	}
}
