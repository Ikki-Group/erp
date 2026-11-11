import { Money } from '@/shared/domain/money.ts'
import { Qty } from '@/shared/domain/qty.ts'

// ─── Types ───

export interface LinePriceInput {
	basePrice: string
	modifierPrices: string[]
	qty: string
}

export interface LinePriceResult {
	unitPrice: string
	modifierTotal: string
	lineTotal: string
}

export interface OrderTotalsInput {
	lineTotals: string[]
	discountAmount: string
	taxRate: string
}

export interface OrderTotalsResult {
	subtotal: string
	discountAmount: string
	taxAmount: string
	total: string
}

// ─── Calculations ───

export function calculateLineTotal(input: LinePriceInput): LinePriceResult {
	const modifierSum = input.modifierPrices.reduce(
		(sum, price) => sum.add(Money.of(price)),
		Money.zero(),
	)
	const unitPrice = Money.of(input.basePrice).add(modifierSum)
	const qty = Qty.of(input.qty)

	return {
		unitPrice: unitPrice.toAmount(),
		modifierTotal: modifierSum.mul(qty).toAmount(),
		lineTotal: unitPrice.mul(qty).toAmount(),
	}
}

export function calculateOrderTotals(input: OrderTotalsInput): OrderTotalsResult {
	const subtotal = input.lineTotals.reduce(
		(sum, lineTotal) => sum.add(Money.of(lineTotal)),
		Money.zero(),
	)
	const discountAmount = Money.of(input.discountAmount)
	const taxableAmount = subtotal.sub(discountAmount)
	const clampedTaxableAmount = taxableAmount.lt(Money.zero()) ? Money.zero() : taxableAmount
	const taxAmount = clampedTaxableAmount.percent(input.taxRate)
	const total = clampedTaxableAmount.add(taxAmount)

	return {
		subtotal: subtotal.toAmount(),
		discountAmount: discountAmount.toAmount(),
		taxAmount: taxAmount.toAmount(),
		total: total.toAmount(),
	}
}
