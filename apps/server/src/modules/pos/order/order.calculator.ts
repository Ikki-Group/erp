import { Decimal, roundPrice, toDecimal } from '@/shared/utils/money.ts'

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
 * All values are integer IDR — safe with native number arithmetic.
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

	return { unitPrice, modifierTotal, lineTotal }
}

/**
 * Calculates order-level totals from line totals, discount, and tax rate.
 * Uses Decimal for the tax step to avoid floating-point drift, then rounds to integer.
 *
 * subtotal = Σ lineTotals
 * taxAmount = round((subtotal - discountAmount) × taxRate / 100)
 * total = subtotal - discountAmount + taxAmount
 *
 * taxRate is expressed as a percentage (e.g. 11 = 11%).
 */
export function calculateOrderTotals(input: OrderTotalsInput): OrderTotalsResult {
	const subtotal = input.lineTotals.reduce((sum, t) => sum + t, 0)
	const discountAmount = input.discountAmount

	// Use Decimal for tax calculation to avoid precision issues
	const taxableAmount = toDecimal(Math.max(subtotal - discountAmount, 0))
	const taxAmount = roundPrice(taxableAmount.mul(toDecimal(input.taxRate)).div(new Decimal(100)))

	const total = Math.max(subtotal - discountAmount + taxAmount, 0)

	return { subtotal, discountAmount, taxAmount, total }
}
