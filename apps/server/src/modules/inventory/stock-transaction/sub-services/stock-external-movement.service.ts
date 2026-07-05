import { money } from '@/shared/utils/money'

import type { DbTx } from '@/infra/database'

import type {
	ProductionInTransactionDto,
	ProductionOutTransactionDto,
	PurchaseTransactionDto,
	SellTransactionDto,
	TransactionResultDto,
	UsageTransactionDto,
} from '../stock-transaction.contract'
import { StockTransactionError } from '../stock-transaction.internal'
import { MovementLogic } from './movement-logic'

export class StockExternalMovementService extends MovementLogic {
	async purchase(
		data: PurchaseTransactionDto,
		actorId: number,
		tx: DbTx,
	): Promise<TransactionResultDto> {
		const { locationId, date, referenceNo, notes, items } = data
		for (const item of items) {
			const { materialId, qty, unitCost } = item
			const assignment = await this.mLocationSvc.findOne(materialId, locationId)

			const { newQty, newAvgCost } = this.calculateIncomingWAC(
				assignment.currentQty,
				assignment.currentAvgCost,
				qty,
				unitCost,
			)

			await this.repo.insert(
				{
					materialId,
					locationId,
					type: 'purchase',
					date,
					referenceNo,
					notes: notes ?? null,
					qty: qty.toString(),
					unitCost: unitCost.toString(),
					totalCost: money(qty).mul(unitCost).toString(),
					runningQty: newQty.toString(),
					runningAvgCost: newAvgCost.toString(),
					createdBy: actorId,
					updatedBy: actorId,
				},
				tx,
			)

			await this.mLocationSvc.updateCurrentStock(
				materialId,
				locationId,
				{
					currentQty: Number(newQty),
					currentAvgCost: Number(newAvgCost),
					currentValue: Number(money(newQty).mul(newAvgCost)),
				},
				actorId,
				tx,
			)
		}
		return { count: items.length, referenceNo }
	}

	async productionIn(
		data: ProductionInTransactionDto,
		actorId: number,
		tx: DbTx,
	): Promise<TransactionResultDto> {
		const { locationId, date, referenceNo, notes, items } = data
		for (const item of items) {
			const { materialId, qty, unitCost } = item
			const assignment = await this.mLocationSvc.findOne(materialId, locationId)

			const { newQty, newAvgCost } = this.calculateIncomingWAC(
				assignment.currentQty,
				assignment.currentAvgCost,
				qty,
				unitCost,
			)

			await this.repo.insert(
				{
					materialId,
					locationId,
					type: 'production_in',
					date,
					referenceNo,
					notes: notes ?? null,
					qty: qty.toString(),
					unitCost: unitCost.toString(),
					totalCost: money(qty).mul(unitCost).toString(),
					runningQty: newQty.toString(),
					runningAvgCost: newAvgCost.toString(),
					createdBy: actorId,
					updatedBy: actorId,
				},
				tx,
			)

			await this.mLocationSvc.updateCurrentStock(
				materialId,
				locationId,
				{
					currentQty: Number(newQty),
					currentAvgCost: Number(newAvgCost),
					currentValue: Number(money(newQty).mul(newAvgCost)),
				},
				actorId,
				tx,
			)
		}
		return { count: items.length, referenceNo }
	}

	async usage(
		data: UsageTransactionDto,
		actorId: number,
		tx: DbTx,
	): Promise<TransactionResultDto> {
		return this.stockOut('usage', data, actorId, tx)
	}

	async sell(
		data: SellTransactionDto,
		actorId: number,
		tx: DbTx,
	): Promise<TransactionResultDto> {
		return this.stockOut('sell', data, actorId, tx)
	}

	async productionOut(
		data: ProductionOutTransactionDto,
		actorId: number,
		tx: DbTx,
	): Promise<TransactionResultDto> {
		return this.stockOut('production_out', data, actorId, tx)
	}

	private async stockOut(
		type: 'usage' | 'sell' | 'production_out',
		data: UsageTransactionDto | SellTransactionDto | ProductionOutTransactionDto,
		actorId: number,
		tx: DbTx,
	): Promise<TransactionResultDto> {
		const { locationId, date, referenceNo, notes, items } = data

		for (const item of items) {
			const { materialId, qty } = item
			const assignment = await this.mLocationSvc.findOne(materialId, locationId)

			const qtyDec = money(qty)
			const cQtyDec = money(assignment.currentQty)

			if (cQtyDec.lt(qtyDec)) {
				throw StockTransactionError.insufficientStock(
					materialId,
					assignment.currentQty,
					qty.toString(),
				)
			}

			const currentAvgCost = money(assignment.currentAvgCost)
			const newQty = cQtyDec.minus(qtyDec)
			const totalCost = qtyDec.mul(currentAvgCost)

			await this.repo.insert(
				{
					materialId,
					locationId,
					type,
					date,
					referenceNo,
					notes: notes ?? null,
					qty: qtyDec.toString(),
					unitCost: currentAvgCost.toString(),
					totalCost: totalCost.toString(),
					counterpartLocationId: null,
					transferId: null,
					runningQty: newQty.toString(),
					runningAvgCost: currentAvgCost.toString(),
					createdBy: actorId,
					updatedBy: actorId,
				},
				tx,
			)

			await this.mLocationSvc.updateCurrentStock(
				materialId,
				locationId,
				{
					currentQty: Number(newQty),
					currentAvgCost: Number(currentAvgCost),
					currentValue: Number(newQty.mul(currentAvgCost)),
				},
				actorId,
				tx,
			)
		}

		return { count: items.length, referenceNo }
	}
}
