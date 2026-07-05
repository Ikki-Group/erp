import Decimal from 'decimal.js'

/**
 * Money / decimal helpers built on `decimal.js`.
 *
 * Postgres `numeric` columns round-trip as **strings** in Drizzle, and JS
 * floats can't represent decimal money exactly — so all monetary math must go
 * through `Decimal`. This module standardizes the common cases; for advanced
 * operations use the returned `Decimal` instance directly (`.mul`, `.div`, …).
 *
 * @example
 * const total = sum(items, (i) => i.subtotal)        // Decimal
 * row.totalAmount = total.toString()                 // back to a numeric string
 *
 * @example
 * if (money(a).eq(money(b))) { ... }                 // exact comparison
 */

/** Anything that can seed a Decimal: a numeric string, number, or Decimal. */
export type MoneyInput = string | number | Decimal

/** Decimal zero — reuse instead of `new Decimal(0)`. */
export const ZERO: Decimal = new Decimal(0)

/** Wrap a value as a `Decimal` (identity if already one). */
export function money(value: MoneyInput = 0): Decimal {
	return value instanceof Decimal ? value : new Decimal(value)
}

/**
 * Sum a numeric field across items using exact decimal math.
 * Returns `ZERO` for an empty array.
 *
 * @example
 * const totalDebit = sum(entry.items, (i) => i.debit)
 */
export function sum<T>(items: readonly T[], selector: (item: T) => MoneyInput): Decimal {
	return items.reduce<Decimal>((acc, item) => acc.plus(money(selector(item))), ZERO)
}

/** Sum a list of money values directly (no selector). */
export function sumValues(values: readonly MoneyInput[]): Decimal {
	return values.reduce<Decimal>((acc, v) => acc.plus(money(v)), ZERO)
}

/** Format a money value as a fixed-scale numeric string (default 2 dp). */
export function toMoneyString(value: MoneyInput, scale = 2): string {
	return money(value).toFixed(scale)
}

export { Decimal }
