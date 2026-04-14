import { db } from '@/db'
import { stampCreate, type DbTx } from '@/core/database'
import { stockTransactionsTable } from '@/db/schema'
import type { MaterialLocationService } from '@/modules/material/service/material-location.service'
import { BadRequestError } from '@/core/http/errors'
import { record } from '@elysiajs/opentelemetry'
import type { TransactionResultDto } from '@/modules/inventory/dto'

export class MovementLogic {
	constructor(protected readonly mLocationSvc: MaterialLocationService) {}

	/**
	 * Weighted Average Cost calculation for incoming stock.
	 */
	protected calculateIncomingWAC(
		currentQty: number,
		currentAvgCost: number,
		incomingQty: number,
		incomingUnitCost: number,
	): { newQty: number; newAvgCost: number } {
		const newQty = currentQty + incomingQty
		const newAvgCost =
			newQty > 0 ? (currentQty * currentAvgCost + incomingQty * incomingUnitCost) / newQty : 0
		return { newQty, newAvgCost }
	}

	/**
	 * Core logic for generic stock reduction (Usage, Sell, ProdOut, TransferOut).
	 */
	protected async handleStockOut(
		type: 'usage' | 'sell' | 'production_out' | 'transfer_out',
		data: {
			locationId: number
			date: Date
			referenceNo: string
			notes?: string | null | undefined
			items: Array<{ materialId: number; qty: number }>
			counterpartLocationId?: number | null | undefined
			transferId?: number | null | undefined
		},
		actorId: number,
		tx: DbTx | typeof db = db,
	): Promise<TransactionResultDto> {
		const { locationId, date, referenceNo, notes, items, counterpartLocationId, transferId } = data

		const metadata = stampCreate(actorId)

		for (const item of items) {
			const { materialId, qty } = item

			await record(`MovementLogic.handleStockOut.${type}.item:${materialId}`, async () => {
				const assignment = await this.mLocationSvc.findOne(materialId, locationId)

				if (assignment.currentQty < qty) {
					throw new BadRequestError(
						`Insufficient stock for material ${materialId}: available ${assignment.currentQty}, requested ${qty}`,
					)
				}

				const currentAvgCost = assignment.currentAvgCost
				const newQty = assignment.currentQty - qty
				const totalCost = qty * currentAvgCost

				await tx.insert(stockTransactionsTable).values({
					materialId,
					locationId,
					type,
					date,
					referenceNo,
					notes: notes ?? null,
					qty: qty.toString(),
					unitCost: currentAvgCost.toString(),
					totalCost: totalCost.toString(),
					counterpartLocationId: counterpartLocationId ?? null,
					transferId: transferId ?? null,
					runningQty: newQty.toString(),
					runningAvgCost: currentAvgCost.toString(),
					...metadata,
				})

				await this.mLocationSvc.updateCurrentStock(
					materialId,
					locationId,
					{
						currentQty: newQty,
						currentAvgCost: currentAvgCost,
						currentValue: newQty * currentAvgCost,
					},
					actorId,
				)
			})
		}

		return { count: items.length, referenceNo }
	}
}
