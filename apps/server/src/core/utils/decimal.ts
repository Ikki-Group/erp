/**
 * Utilities for handling Decimal values from Drizzle (which are returned as strings).
 */

/**
 * Recursively converts string decimals in an object or array to numbers.
 * Useful for Drizzle Decimal columns which are returned as strings to preserve precision,
 * but often need to be numbers for the frontend or calculations.
 */
export function transformDecimals<T>(data: T): T {
  if (data === null || data === undefined) {
    return data
  }

  if (Array.isArray(data)) {
    return data.map((item) => transformDecimals(item)) as unknown as T
  }

  if (typeof data === 'object') {
    const result = { ...(data as object) } as any
    for (const key in result) {
      if (!Object.prototype.hasOwnProperty.call(result, key)) continue

      const value = result[key]

      if (typeof value === 'string' && value !== '' && !isNaN(Number(value)) && isFinite(Number(value))) {
        if (isDecimalKey(key)) {
          result[key] = Number(value)
        }
      } else if (typeof value === 'object' && value !== null) {
        result[key] = transformDecimals(value)
      }
    }
    return result as T
  }

  return data as T
}

/**
 * Checks if a key name suggests it's a decimal value (quantity, cost, price, etc.)
 */
function isDecimalKey(key: string): boolean {
  const decimalPatterns = [
    'qty',
    'cost',
    'price',
    'total',
    'amount',
    'avg',
    'value',
    'balance',
    'rate',
    'discount',
    'tax',
  ]
  const lowerKey = key.toLowerCase()
  return decimalPatterns.some((pattern) => lowerKey.includes(pattern))
}
