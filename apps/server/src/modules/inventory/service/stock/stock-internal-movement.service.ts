import { db } from '@/db'
import { stampCreate, type DbTx } from '@/core/database'
import { stockTransactionsTable } from '@/db/schema'
import { MovementLogic } from './movement-logic'
import { BadRequestError } from '@/core/http/errors'
import type {
	TransferTransactionDto,
	AdjustmentTransactionDto,
	StockOpnameDto,
	TransactionResultDto,
} from '@/modules/inventory/dto'
import { record } from '@elysiajs/opentelemetry'

export class StockInternalMovementService extends MovementLogic {
	/**
	 * Transfer multiple materials between two locations.
	 */
	async handleTransfer(
		data: TransferTransactionDto,
		actorId: number,
		tx: DbTx | typeof db = db,
	): Promise<TransactionResultDto> {
		return record('StockInternalMovementService.handleTransfer', async () => {
			if (tx === db) {
				return db.transaction(async (trx) => this.executeTransfer(data, actorId, trx))
			}
			return this.executeTransfer(data, actorId, tx as DbTx)
		})
	}

	private async executeTransfer(
		data: TransferTransactionDto,
		actorId: number,
		tx: DbTx,
	): Promise<TransactionResultDto> {
		const { sourceLocationId, destinationLocationId, date, referenceNo, notes, items } = data
		const transferId = Math.floor(Date.now() / 1000)

		const metadata = stampCreate(actorId)

		for (const item of items) {
			const { materialId, qty } = item

			await record(`StockInternalMovementService.handleTransfer.item:${materialId}`, async () => {
				const sourceAssignment = await this.mLocationSvc.findOne(materialId, sourceLocationId)
				const destAssignment = await this.mLocationSvc.findOne(materialId, destinationLocationId)

				if (sourceAssignment.currentQty < qty) {
					throw new BadRequestError(
						`Insufficient stock for material ${materialId} at source: available ${sourceAssignment.currentQty}, requested ${qty}`,
					)
				}

				const transferCost = qty * sourceAssignment.currentAvgCost

				// ── Transfer OUT (Delegating to Logic)
				await this.handleStockOut(
					'transfer_out',
					{
						locationId: sourceLocationId,
						date,
						referenceNo,
						notes,
						items: [{ materialId, qty }],
						counterpartLocationId: destinationLocationId,
						transferId,
					},
					actorId,
					tx,
				)

				// ── Transfer IN
				const { newQty, newAvgCost } = this.calculateIncomingWAC(
					destAssignment.currentQty,
					destAssignment.currentAvgCost,
					qty,
					sourceAssignment.currentAvgCost,
				)

				await tx.insert(stockTransactionsTable).values({
					materialId,
					locationId: destinationLocationId,
					type: 'transfer_in',
					date,
					referenceNo,
					notes: notes ?? null,
					qty: qty.toString(),
					unitCost: sourceAssignment.currentAvgCost.toString(),
					totalCost: transferCost.toString(),
					counterpartLocationId: sourceLocationId,
					transferId,
					runningQty: newQty.toString(),
					runningAvgCost: newAvgCost.toString(),
					...metadata,
				})

				await this.mLocationSvc.updateCurrentStock(
					materialId,
					destinationLocationId,
					{ currentQty: newQty, currentAvgCost: newAvgCost, currentValue: newQty * newAvgCost },
					actorId,
					tx,
				)
			})
		}

		return { count: items.length, referenceNo }
	}

	/**
	 * Record Stock Opname (Physical Count Reconciliation).
	 */
	async handleOpname(
		data: StockOpnameDto,
		actorId: number,
		tx: DbTx | typeof db = db,
	): Promise<TransactionResultDto> {
		return record('StockInternalMovementService.handleOpname', async () => {
			if (tx === db) {
				return db.transaction(async (trx) => this.executeOpname(data, actorId, trx))
			}
			return this.executeOpname(data, actorId, tx as DbTx)
		})
	}

	private async executeOpname(
		data: StockOpnameDto,
		actorId: number,
		tx: DbTx,
	): Promise<TransactionResultDto> {
		const { locationId, date, referenceNo, notes, items } = data
		const metadata = stampCreate(actorId)

		for (const item of items) {
			const { materialId, physicalQty } = item

			await record(`StockInternalMovementService.handleOpname.item:${materialId}`, async () => {
				const assignment = await this.mLocationSvc.findOne(materialId, locationId)
				const diffQty = physicalQty - assignment.currentQty

				if (diffQty === 0) return

				const { newQty, newAvgCost } =
					diffQty > 0
						? this.calculateIncomingWAC(
								assignment.currentQty,
								assignment.currentAvgCost,
								diffQty,
								assignment.currentAvgCost,
							)
						: { newQty: physicalQty, newAvgCost: assignment.currentAvgCost }

				await tx.insert(stockTransactionsTable).values({
					materialId,
					locationId,
					type: 'adjustment',
					date,
					referenceNo,
					notes: `Stock Opname: ${notes ?? ''}`.trim(),
					qty: diffQty.toString(),
					unitCost: assignment.currentAvgCost.toString(),
					totalCost: (Math.abs(diffQty) * assignment.currentAvgCost).toString(),
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
	 * Generic manual stock adjustment.
	 */
	async handleAdjustment(
		data: AdjustmentTransactionDto,
		actorId: number,
		tx: DbTx | typeof db = db,
	): Promise<TransactionResultDto> {
		return record('StockInternalMovementService.handleAdjustment', async () => {
			if (tx === db) {
				return db.transaction(async (trx) => this.executeAdjustment(data, actorId, trx))
			}
			return this.executeAdjustment(data, actorId, tx as DbTx)
		})
	}

	private async executeAdjustment(
		data: AdjustmentTransactionDto,
		actorId: number,
		tx: DbTx,
	): Promise<TransactionResultDto> {
		const { locationId, date, referenceNo, notes, items } = data
		const metadata = stampCreate(actorId)

		for (const item of items) {
			const { materialId, qty } = item

			await record(`StockInternalMovementService.handleAdjustment.item:${materialId}`, async () => {
				const assignment = await this.mLocationSvc.findOne(materialId, locationId)
				const effectiveUnitCost = item.unitCost ?? assignment.currentAvgCost

				const { newQty, newAvgCost } =
					qty > 0
						? this.calculateIncomingWAC(
								assignment.currentQty,
								assignment.currentAvgCost,
								qty,
								effectiveUnitCost,
							)
						: { newQty: assignment.currentQty + qty, newAvgCost: assignment.currentAvgCost }

				if (newQty < 0)
					throw new BadRequestError(
						`Adjustment results in negative stock for material ${materialId}`,
					)

				await tx.insert(stockTransactionsTable).values({
					materialId,
					locationId,
					type: 'adjustment',
					date,
					referenceNo,
					notes: notes ?? null,
					qty: qty.toString(),
					unitCost: effectiveUnitCost.toString(),
					totalCost: (Math.abs(qty) * effectiveUnitCost).toString(),
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
}
