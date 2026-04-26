import { record } from '@elysiajs/opentelemetry'

import { stampCreate, type DbTx } from '@/core/database'
import { BadRequestError } from '@/core/http/errors'

import { db } from '@/db'
import { stockTransactionsTable } from '@/db/schema'
import Decimal from 'decimal.js'

import type { TransactionResultDto } from '@/modules/inventory/dto'
import type { MaterialLocationService } from '@/modules/material/service/material-location.service'

export class MovementLogic {
	constructor(protected readonly mLocationSvc: MaterialLocationService) {}

	/**
	 * Weighted Average Cost calculation for incoming stock.
	 */
	protected calculateIncomingWAC(
		currentQty: string | number,
		currentAvgCost: string | number,
		incomingQty: string | number,
		incomingUnitCost: string | number,
	): { newQty: string; newAvgCost: string } {
		const cQty = new Decimal(currentQty)
		const cCost = new Decimal(currentAvgCost)
		const iQty = new Decimal(incomingQty)
		const iCost = new Decimal(incomingUnitCost)

		const newQty = cQty.plus(iQty)
		const newAvgCost = newQty.isPositive()
			? cQty.mul(cCost).plus(iQty.mul(iCost)).div(newQty)
			: new Decimal(0)
		return { newQty: newQty.toString(), newAvgCost: newAvgCost.toString() }
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
			items: Array<{ materialId: number; qty: string | number }>
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

				const qtyDec = new Decimal(qty)
				const cQtyDec = new Decimal(assignment.currentQty)

				if (cQtyDec.lt(qtyDec)) {
					throw new BadRequestError(
						`Insufficient stock for material ${materialId}: available ${assignment.currentQty}, requested ${qty}`,
					)
				}

				const currentAvgCost = new Decimal(assignment.currentAvgCost)
				const newQty = cQtyDec.minus(qtyDec)
				const totalCost = qtyDec.mul(currentAvgCost)

				await tx.insert(stockTransactionsTable).values({
					materialId,
					locationId,
					type,
					date,
					referenceNo,
					notes: notes ?? null,
					qty: qtyDec.toString() as any,
						// @ts-ignore
					unitCost: currentAvgCost.toString(),
					totalCost: totalCost.toString(),
					counterpartLocationId: counterpartLocationId ?? null,
					transferId: transferId ?? null,
					runningQty: newQty.toString() as any,
					runningAvgCost: currentAvgCost.toString(),
					...metadata,
				})

				await this.mLocationSvc.updateCurrentStock(
					materialId,
					locationId,
					{
						currentQty: newQty.toString() as any,
						currentAvgCost: currentAvgCost.toString() as any,
						currentValue: newQty.mul(currentAvgCost).toString() as any,
					},
					actorId,
				)
			})
		}

		return { count: items.length, referenceNo }
	}
}
