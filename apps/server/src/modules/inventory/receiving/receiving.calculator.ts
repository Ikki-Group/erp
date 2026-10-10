import type { Money } from '@/shared/domain/money.ts'
import type { Qty } from '@/shared/domain/qty.ts'

/**
 * Converts a purchase line to base UoM. `factor` is base units per one
 * purchase unit; the unit cost scales inversely so the line value is kept.
 */
export function toBaseUnits(qty: Qty, unitCost: Money, factor: Qty): { qty: Qty; unitCost: Money } {
	return { qty: qty.mul(factor), unitCost: unitCost.div(factor) }
}
