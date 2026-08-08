import { Decimal } from 'decimal.js'

// ─── Configuration ───

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP })

// ─── Conversions ───

/** Parse any numeric input to Decimal safely. */
export const toDecimal = (v: string | number): Decimal => new Decimal(v)

// ─── Rounding ───

/** Round to integer (IDR prices have no subunit). Returns number. */
export const roundPrice = (d: Decimal): number => d.round().toNumber()

/** Round to 4 decimal places (cost precision). Returns string for DB storage. */
export const roundCost = (d: Decimal): string => d.toDecimalPlaces(4).toFixed(4)

/** Round to 6 decimal places (quantity/factor precision). Returns string. */
export const roundQty = (d: Decimal): string => d.toDecimalPlaces(6).toFixed(6)

// ─── Domain Helpers ───

/**
 * Weighted average cost calculation with full precision.
 *
 * Formula: ((oldQty × oldCost) + (inQty × inCost)) / (oldQty + inQty)
 * Returns Decimal(0) if total quantity is zero (avoids division by zero).
 */
export function weightedAvgCost(
	oldQty: Decimal,
	oldCost: Decimal,
	inQty: Decimal,
	inCost: Decimal,
): Decimal {
	const totalQty = oldQty.add(inQty)
	if (totalQty.isZero()) return new Decimal(0)
	return oldQty.mul(oldCost).add(inQty.mul(inCost)).div(totalQty)
}

/**
 * Safe division for cost conversion (unitCost / factor).
 * Returns Decimal(0) if divisor is zero.
 */
export function safeDivide(numerator: Decimal, divisor: Decimal): Decimal {
	if (divisor.isZero()) return new Decimal(0)
	return numerator.div(divisor)
}

// ─── Re-export Decimal for callers who need raw arithmetic ───

export { Decimal }
