import { Money } from './money.ts'
import { Qty } from './qty.ts'

export function weightedAvgCost(oldQty: Qty, oldCost: Money, inQty: Qty, inCost: Money): Money {
	const totalQty = oldQty.add(inQty)
	if (totalQty.isZero()) return Money.zero()

	const numerator = oldCost.mul(oldQty).add(inCost.mul(inQty))
	return Money.of(numerator.toDecimal().div(totalQty.toDecimal()).toString())
}
