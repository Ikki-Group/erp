import { Qty } from '@/shared/domain/qty.ts'

/** Cumulative received qty after a receipt, or `undefined` when it would exceed the requested qty. */
export function nextReceivedQty(
	requested: Qty,
	alreadyReceived: Qty,
	incoming: Qty,
): Qty | undefined {
	const total = alreadyReceived.add(incoming)
	return total.gt(requested) ? undefined : total
}

export function isFullyReceived(
	lines: { requestedQty: string; receivedQty: string | null }[],
): boolean {
	return lines.every((l) => Qty.of(l.receivedQty ?? '0').gte(Qty.of(l.requestedQty)))
}
