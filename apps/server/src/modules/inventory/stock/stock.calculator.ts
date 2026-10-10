import { Money } from '@/shared/domain/money.ts'
import { Qty } from '@/shared/domain/qty.ts'

import type { MovementDirectionEnum, MovementTypeEnum } from '@ikki/contract/inventory/stock'

export interface Balance {
	qty: Qty
	cost: Money
}

export interface Movement {
	type: MovementTypeEnum
	direction: MovementDirectionEnum
	qty: Qty
	unitCost?: Money | undefined
}

/** Only these inbound movements carry a cost into the balance (ADR-0010 §2). */
const COST_SETTING_TYPES: ReadonlySet<MovementTypeEnum> = new Set([
	'purchase_receipt',
	'transfer_in',
	'production_in',
])

/**
 * Weighted average (ADR-0010 §1): blend when on-hand is positive, otherwise
 * reset to the incoming cost (a negative balance is a stock debt).
 */
export function weightedAvgCost(oldQty: Qty, oldCost: Money, inQty: Qty, inCost: Money): Money {
	if (oldQty.lte(Qty.zero())) return inCost
	const totalQty = oldQty.add(inQty)
	if (totalQty.isZero()) return Money.zero()
	return oldCost.mul(oldQty).add(inCost.mul(inQty)).div(totalQty)
}

/**
 * The balance after a movement, or `undefined` when a transfer-out exceeds
 * on-hand. Every other outbound movement is permissive and may go negative.
 */
export function applyMovement(current: Balance, move: Movement): Balance | undefined {
	if (move.direction === 'out') {
		if (move.type === 'transfer_out' && current.qty.lt(move.qty)) return undefined
		return { qty: current.qty.sub(move.qty), cost: current.cost }
	}
	const cost =
		move.unitCost && COST_SETTING_TYPES.has(move.type)
			? weightedAvgCost(current.qty, current.cost, move.qty, move.unitCost)
			: current.cost
	return { qty: current.qty.add(move.qty), cost }
}
