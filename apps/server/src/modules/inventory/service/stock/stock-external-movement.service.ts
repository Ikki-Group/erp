import { db } from '@/db'
import { stampCreate, type DbTx } from '@/core/database'
import { stockTransactionsTable } from '@/db/schema'
import { MovementLogic } from './movement-logic'
import type {
	PurchaseTransactionDto,
	UsageTransactionDto,
	SellTransactionDto,
	ProductionInTransactionDto,
	ProductionOutTransactionDto,
	TransactionResultDto,
} from '@/modules/inventory/dto'
import { record } from '@elysiajs/opentelemetry'

export class StockExternalMovementService extends MovementLogic {
	/**
	 * Record purchase transactions for multiple materials at one location.
	 */
	async handlePurchase(
		data: PurchaseTransactionDto,
		actorId: number,
		tx: DbTx | typeof db = db,
	): Promise<TransactionResultDto> {
		return record('StockExternalMovementService.handlePurchase', async () => {
			if (tx === db) {
				return db.transaction(async (trx) => this.executePurchase(data, actorId, trx))
			}
			return this.executePurchase(data, actorId, tx as DbTx)
		})
	}

	private async executePurchase(
		data: PurchaseTransactionDto,
		actorId: number,
		tx: DbTx,
	): Promise<TransactionResultDto> {
		const { locationId, date, referenceNo, notes, items } = data
		const metadata = stampCreate(actorId)

		for (const item of items) {
			const { materialId, qty, unitCost } = item

			await record(`StockExternalMovementService.handlePurchase.item:${materialId}`, async () => {
				const assignment = await this.mLocationSvc.findOne(materialId, locationId)

				const { newQty, newAvgCost } = this.calculateIncomingWAC(
					assignment.currentQty,
					assignment.currentAvgCost,
					qty,
					unitCost,
				)

				await tx.insert(stockTransactionsTable).values({
					materialId,
					locationId,
					type: 'purchase',
					date,
					referenceNo,
					notes: notes ?? null,
					qty: qty.toString(),
					unitCost: unitCost.toString(),
					totalCost: (qty * unitCost).toString(),
					runningQty: newQty.toString(),
					runningAvgCost: newAvgCost.toString(),
					...metadata,
				})

				await this.mLocationSvc.updateCurrentStock(
					materialId,
					locationId,
					{ currentQty: newQty, currentAvgCost: newAvgCost, currentValue: newQty * newAvgCost },
					actorId,
					tx,
				)
			})
		}

		return { count: items.length, referenceNo }
	}

	/**
	 * Record production inputs (finished goods) at a location.
	 */
	async handleProductionIn(
		data: ProductionInTransactionDto,
		actorId: number,
		tx: DbTx | typeof db = db,
	): Promise<TransactionResultDto> {
		return record('StockExternalMovementService.handleProductionIn', async () => {
			if (tx === db) {
				return db.transaction(async (trx) => this.executeProductionIn(data, actorId, trx))
			}
			return this.executeProductionIn(data, actorId, tx as DbTx)
		})
	}

	private async executeProductionIn(
		data: ProductionInTransactionDto,
		actorId: number,
		tx: DbTx,
	): Promise<TransactionResultDto> {
		const { locationId, date, referenceNo, notes, items } = data
		const metadata = stampCreate(actorId)

		for (const item of items) {
			const { materialId, qty, unitCost } = item

			await record(
				`StockExternalMovementService.handleProductionIn.item:${materialId}`,
				async () => {
					const assignment = await this.mLocationSvc.findOne(materialId, locationId)

					const { newQty, newAvgCost } = this.calculateIncomingWAC(
						assignment.currentQty,
						assignment.currentAvgCost,
						qty,
						unitCost,
					)

					await tx.insert(stockTransactionsTable).values({
						materialId,
						locationId,
						type: 'production_in',
						date,
						referenceNo,
						notes: notes ?? null,
						qty: qty.toString(),
						unitCost: unitCost.toString(),
						totalCost: (qty * unitCost).toString(),
						runningQty: newQty.toString(),
						runningAvgCost: newAvgCost.toString(),
						...metadata,
					})

					await this.mLocationSvc.updateCurrentStock(
						materialId,
						locationId,
						{ currentQty: newQty, currentAvgCost: newAvgCost, currentValue: newQty * newAvgCost },
						actorId,
						tx,
					)
				},
			)
		}

		return { count: items.length, referenceNo }
	}

	async handleUsage(
		data: UsageTransactionDto,
		actorId: number,
		tx: DbTx | typeof db = db,
	): Promise<TransactionResultDto> {
		return this.handleStockOut('usage', data, actorId, tx)
	}

	async handleSell(
		data: SellTransactionDto,
		actorId: number,
		tx: DbTx | typeof db = db,
	): Promise<TransactionResultDto> {
		return this.handleStockOut('sell', data, actorId, tx)
	}

	async handleProductionOut(
		data: ProductionOutTransactionDto,
		actorId: number,
		tx: DbTx | typeof db = db,
	): Promise<TransactionResultDto> {
		return this.handleStockOut('production_out', data, actorId, tx)
	}
}
