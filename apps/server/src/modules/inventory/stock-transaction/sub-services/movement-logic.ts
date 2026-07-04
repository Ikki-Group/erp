import type { DbTx } from '@/infra/database'

import type { IStockTransactionRepo } from '../stock-transaction.repo'

export class MovementLogic {
	constructor(
		protected readonly repo: IStockTransactionRepo,
		protected readonly mLocationSvc: {
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
		},
	) {}

	protected calculateIncomingWAC(
		currentQty: string | number,
		currentAvgCost: string | number,
		incomingQty: string | number,
		incomingUnitCost: string | number,
	): { newQty: string; newAvgCost: string } {
		const cQty = Number(currentQty)
		const cCost = Number(currentAvgCost)
		const iQty = Number(incomingQty)
		const iCost = Number(incomingUnitCost)

		const newQty = cQty + iQty
		const newAvgCost = newQty > 0 ? (cQty * cCost + iQty * iCost) / newQty : 0
		return { newQty: newQty.toString(), newAvgCost: newAvgCost.toString() }
	}
}
