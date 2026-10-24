import { Money } from './money.ts'
import { Qty } from './qty.ts'

export function weightedAvgCost(oldQty: Qty, oldCost: Money, inQty: Qty, inCost: Money): Money {
	if (oldQty.lte(Qty.zero())) return inCost

	const totalQty = oldQty.add(inQty)
	if (totalQty.isZero()) return Money.zero()

	return oldCost.mul(oldQty).add(inCost.mul(inQty)).div(totalQty)
}
