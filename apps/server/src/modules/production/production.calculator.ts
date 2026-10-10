import { Money } from '@/shared/domain/money.ts'
import type { Qty } from '@/shared/domain/qty.ts'

/** Planned output of an order = recipe yield × batch multiplier (in the yield UoM). */
export function plannedOutputQty(yieldQty: Qty, multiplier: Qty): Qty {
	return yieldQty.mul(multiplier)
}

/** Input consumed for a planned output (ADR-0014 §1.2): `line.qty / yieldQty × plannedQty`. */
export function inputRequirement(lineQty: Qty, yieldQty: Qty, plannedQty: Qty): Qty {
	return lineQty.mul(plannedQty).div(yieldQty)
}

/** Absorbed output cost (ADR-0014 §1.4): `Σ(input qty × input cost) / output qty`; zero output → zero. */
export function outputUnitCost(inputs: { qty: Qty; unitCost: Money }[], outputQty: Qty): Money {
	const total = inputs.reduce((sum, i) => sum.add(i.unitCost.mul(i.qty)), Money.zero())
	return total.div(outputQty)
}
