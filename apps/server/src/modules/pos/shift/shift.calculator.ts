import type { Money } from '@/shared/domain/money.ts'

/** Shift close reconciliation (ADR-0013 §5): expected = opening + cash payments; variance = counted − expected. */
export function reconcileShift(input: {
	openingCash: Money
	cashPayments: Money
	closingCash: Money
}): {
	expectedCash: Money
	variance: Money
} {
	const expectedCash = input.openingCash.add(input.cashPayments)
	return { expectedCash, variance: input.closingCash.sub(expectedCash) }
}
