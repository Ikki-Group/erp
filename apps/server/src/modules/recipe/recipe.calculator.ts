import { Money } from '@/shared/domain/money.ts'
import type { Qty } from '@/shared/domain/qty.ts'

/** Material consumed by `orderQty` units of a recipe yielding `yieldQty` (ADR-0011). Zero yield → zero. */
export function recipeUsage(lineQty: Qty, orderQty: Qty, yieldQty: Qty): Qty {
	return lineQty.mul(orderQty).div(yieldQty)
}

/** HPP per unit = Σ(base qty × location cost) ÷ yield (ADR-0010). Zero yield → zero. */
export function calculateHpp(
	lines: { baseQty: Qty; unitCost: Money }[],
	yieldQty: Qty,
): { lineCosts: Money[]; hpp: Money } {
	const lineCosts = lines.map((line) => line.unitCost.mul(line.baseQty))
	const total = lineCosts.reduce((sum, cost) => sum.add(cost), Money.zero())
	return { lineCosts, hpp: total.div(yieldQty) }
}
