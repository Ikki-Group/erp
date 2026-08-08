// ─── Types ───

export interface LinePriceInput {
	basePrice: number
	modifierPrices: number[]
	qty: number
}

export interface LinePriceResult {
	unitPrice: number
	modifierTotal: number
	lineTotal: number
}

export interface OrderTotalsInput {
	lineTotals: number[]
	discountAmount: number
	taxRate: number
}

export interface OrderTotalsResult {
	subtotal: number
	discountAmount: number
	taxAmount: number
	total: number
}

// ─── Calculations ───

/**
 * Calculates the price for a single order line.
 *
 * unitPrice = basePrice + Σ modifierPrices
 * modifierTotal = Σ modifierPrices × qty
 * lineTotal = unitPrice × qty
 */
export function calculateLineTotal(input: LinePriceInput): LinePriceResult {
	const modifierSum = input.modifierPrices.reduce((sum, p) => sum + p, 0)
	const unitPrice = input.basePrice + modifierSum
	const modifierTotal = modifierSum * input.qty
	const lineTotal = unitPrice * input.qty

	return {
		unitPrice: round2(unitPrice),
		modifierTotal: round2(modifierTotal),
		lineTotal: round2(lineTotal),
	}
}

/**
 * Calculates order-level totals from line totals, discount, and tax rate.
 *
 * subtotal = Σ lineTotals
 * taxAmount = (subtotal - discountAmount) × taxRate
 * total = subtotal - discountAmount + taxAmount
 */
export function calculateOrderTotals(input: OrderTotalsInput): OrderTotalsResult {
	const subtotal = input.lineTotals.reduce((sum, t) => sum + t, 0)
	const taxableAmount = Math.max(subtotal - input.discountAmount, 0)
	const taxAmount = taxableAmount * input.taxRate
	const total = subtotal - input.discountAmount + taxAmount

	return {
		subtotal: round2(subtotal),
		discountAmount: round2(input.discountAmount),
		taxAmount: round2(taxAmount),
		total: round2(Math.max(total, 0)),
	}
}

// ─── Helpers ───

/** Round to 2 decimal places (standard currency precision). */
function round2(value: number): number {
	return Math.round(value * 100) / 100
}
