import { Qty } from '@/shared/domain/qty.ts'

export interface OpnameAdjustment {
	type: 'adjustment_in' | 'adjustment_out'
	direction: 'in' | 'out'
	qty: Qty
}

/** The adjustment that reconciles the snapshot to the count, or `undefined` when they match. */
export function opnameAdjustment(systemQty: Qty, actualQty: Qty): OpnameAdjustment | undefined {
	const variance = actualQty.sub(systemQty)
	if (variance.isZero()) return undefined
	return variance.gt(Qty.zero())
		? { type: 'adjustment_in', direction: 'in', qty: variance }
		: { type: 'adjustment_out', direction: 'out', qty: variance.abs() }
}
