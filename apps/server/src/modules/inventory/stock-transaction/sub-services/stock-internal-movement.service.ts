import { money } from '@/shared/utils/money'

import type { DbTx } from '@/infra/database'

import type {
	AdjustmentTransactionDto,
	StockOpnameDto,
	TransactionResultDto,
	TransferTransactionDto,
} from '../stock-transaction.contract'
import { StockTransactionError } from '../stock-transaction.internal'
import { MovementLogic } from './movement-logic'

export class StockInternalMovementService extends MovementLogic {
	async transfer(
		data: TransferTransactionDto,
		actorId: number,
		tx: DbTx,
	): Promise<TransactionResultDto> {
		const { sourceLocationId, destinationLocationId, date, referenceNo, notes, items } = data
		const transferId = Math.floor(Date.now() / 1000)

		for (const item of items) {
			const { materialId, qty } = item

			const sourceAssignment = await this.mLocationSvc.findOne(materialId, sourceLocationId)
			const destAssignment = await this.mLocationSvc.findOne(materialId, destinationLocationId)

			const sQtyDec = money(sourceAssignment.currentQty)
			const qtyDec = money(qty)

			if (sQtyDec.lt(qtyDec)) {
				throw StockTransactionError.insufficientStock(
					materialId,
					sourceAssignment.currentQty,
					qty.toString(),
				)
			}

			const transferCost = qtyDec.mul(sourceAssignment.currentAvgCost)

			const newSourceQty = sQtyDec.minus(qtyDec)
			await this.repo.insert(
				{
					materialId,
					locationId: sourceLocationId,
					type: 'transfer_out',
					date,
					referenceNo,
					notes: notes ?? null,
					qty: qtyDec.toString(),
					unitCost: sourceAssignment.currentAvgCost.toString(),
					totalCost: transferCost.toString(),
					counterpartLocationId: destinationLocationId,
					transferId,
					runningQty: newSourceQty.toString(),
					runningAvgCost: sourceAssignment.currentAvgCost.toString(),
					createdBy: actorId,
					updatedBy: actorId,
				},
				tx,
			)

			await this.mLocationSvc.updateCurrentStock(
				materialId,
				sourceLocationId,
				{
					currentQty: Number(newSourceQty),
					currentAvgCost: Number(sourceAssignment.currentAvgCost),
					currentValue: Number(newSourceQty.mul(sourceAssignment.currentAvgCost)),
				},
				actorId,
				tx,
			)

			const { newQty, newAvgCost } = this.calculateIncomingWAC(
				destAssignment.currentQty,
				destAssignment.currentAvgCost,
				qty,
				sourceAssignment.currentAvgCost,
			)

			await this.repo.insert(
				{
					materialId,
					locationId: destinationLocationId,
					type: 'transfer_in',
					date,
					referenceNo,
					notes: notes ?? null,
					qty: qtyDec.toString(),
					unitCost: sourceAssignment.currentAvgCost.toString(),
					totalCost: transferCost.toString(),
					counterpartLocationId: sourceLocationId,
					transferId,
					runningQty: newQty.toString(),
					runningAvgCost: newAvgCost.toString(),
					createdBy: actorId,
					updatedBy: actorId,
				},
				tx,
			)

			await this.mLocationSvc.updateCurrentStock(
				materialId,
				destinationLocationId,
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

	async adjustment(
		data: AdjustmentTransactionDto,
		actorId: number,
		tx: DbTx,
	): Promise<TransactionResultDto> {
		const { locationId, date, referenceNo, notes, items } = data

		for (const item of items) {
			const { materialId, qty } = item
			const assignment = await this.mLocationSvc.findOne(materialId, locationId)
			const effectiveUnitCost = item.unitCost ?? assignment.currentAvgCost

			const qtyDec = money(qty)
			const { newQty, newAvgCost } = qtyDec.isPositive()
				? this.calculateIncomingWAC(
						assignment.currentQty,
						assignment.currentAvgCost,
						qty,
						effectiveUnitCost,
					)
				: {
						newQty: money(assignment.currentQty).plus(qtyDec).toString(),
						newAvgCost: assignment.currentAvgCost.toString(),
					}

			if (money(newQty).isNegative()) {
				throw StockTransactionError.negativeStock(materialId)
			}

			await this.repo.insert(
				{
					materialId,
					locationId,
					type: 'adjustment',
					date,
					referenceNo,
					notes: notes ?? null,
					qty: qtyDec.toString(),
					unitCost: effectiveUnitCost.toString(),
					totalCost: qtyDec.abs().mul(effectiveUnitCost).toString(),
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

	async opname(
		data: StockOpnameDto,
		actorId: number,
		tx: DbTx,
	): Promise<TransactionResultDto> {
		const { locationId, date, referenceNo, notes, items } = data

		for (const item of items) {
			const { materialId, physicalQty } = item

			const assignment = await this.mLocationSvc.findOne(materialId, locationId)
			const diffQty = money(physicalQty).minus(assignment.currentQty)

			if (diffQty.isZero()) continue

			const { newQty, newAvgCost } = diffQty.isPositive()
				? this.calculateIncomingWAC(
						assignment.currentQty,
						assignment.currentAvgCost,
						diffQty.toString(),
						assignment.currentAvgCost,
					)
				: {
						newQty: money(physicalQty).toString(),
						newAvgCost: assignment.currentAvgCost.toString(),
					}

			await this.repo.insert(
				{
					materialId,
					locationId,
					type: 'adjustment',
					date,
					referenceNo,
					notes: `Stock Opname: ${notes ?? ''}`.trim(),
					qty: diffQty.toString(),
					unitCost: assignment.currentAvgCost.toString(),
					totalCost: diffQty.abs().mul(assignment.currentAvgCost).toString(),
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
}
