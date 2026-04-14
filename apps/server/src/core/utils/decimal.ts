/**
 * Utilities for handling Decimal values from Drizzle (which are returned as strings).
 */

/**
 * Recursively converts string decimals in an object or array to numbers.
 * Useful for Drizzle Decimal columns which are returned as strings to preserve precision,
 * but often need to be numbers for the frontend or calculations.
 */
/**
 * Recursively converts string-encoded decimals in an object or array to numbers.
 * This is specific to Drizzle's Decimal behavior where numeric precision is preserved via strings.
 */
export function transformDecimals<T>(data: T): T {
  if (data === null || typeof data !== 'object') {
    return data
  }

  if (Array.isArray(data)) {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion unicorn/no-array-callback-reference
    return data.map(transformDecimals) as unknown as T
  }

  const result = { ...data } as Record<string, any>

  for (const [key, value] of Object.entries(result)) {
    if (shouldTransformKey(key, value)) {
      result[key] = Number(value)
      continue
    }

    if (typeof value === 'object' && value !== null) {
      // oxlint-disable-next-line typescript/no-unsafe-assignment
      result[key] = transformDecimals(value)
    }
  }

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return result as T
}

/**
 * Heuristic to determine if a value should be converted from string to number.
 * Conditions:
 * 1. Value is a non-empty string that represents a valid finite number.
 * 2. Key name suggests it's a quantitative measurement (qty, cost, price, etc.).
 */
function shouldTransformKey(key: string, value: any): boolean {
  if (typeof value !== 'string' || value === '') {
    return false
  }

  const num = Number(value)
  if (isNaN(num) || !isFinite(num)) {
    return false
  }

  const numericPatterns = [
    'qty',
    'cost',
    'price',
    'amount',
    'total',
    'avg',
    'value',
    'balance',
    'rate',
    'discount',
    'tax',
    'percentage',
    'running',
  ]

  const lowerKey = key.toLowerCase()
  return numericPatterns.some((pattern) => lowerKey.includes(pattern))
}
