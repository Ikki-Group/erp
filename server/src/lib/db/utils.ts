import { BadRequestError, NotFoundError } from '@/lib/error/http'

/* -------------------------------------------------------------------------- */
/*                              ID Utilities                                  */
/* -------------------------------------------------------------------------- */

/**
 * Parses a value into a valid integer ID, or returns null if invalid.
 * Safe for optional / user-input cases.
 */
export function tryParseId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string') {
    const n = Number(value)
    if (Number.isInteger(n) && n > 0) return n
  }
  return null
}

/**
 * Parses a value into a valid integer ID, or throws BadRequestError.
 * Use in the service layer for required IDs.
 */
export function parseId(value: unknown, errorCode = 'INVALID_ID'): number {
  const id = tryParseId(value)
  if (id === null) throw new BadRequestError('Invalid or missing ID', errorCode)
  return id
}

/**
 * Type guard: checks whether a value is a positive integer suitable for use as a DB ID.
 */
export function isValidId(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

/* -------------------------------------------------------------------------- */
/*                           General DB Helpers                               */
/* -------------------------------------------------------------------------- */

/**
 * Extracts the first result from an array, or returns null.
 * Convenient for Drizzle queries that return arrays.
 *
 * @example
 * const user = takeFirst(await db.select().from(users).where(eq(users.id, id)))
 */
export function takeFirst<T>(results: T[]): T | null {
  return results[0] ?? null
}

/**
 * Extracts the first result from an array, or throws NotFoundError.
 *
 * @example
 * const user = takeFirstOrThrow(
 *   await db.select().from(users).where(eq(users.id, id)),
 *   'User not found',
 *   'USER_NOT_FOUND'
 * )
 */
export function takeFirstOrThrow<T>(results: T[], message: string, code?: string): T {
  const first = results[0]
  if (!first) throw new NotFoundError(message, code)
  return first
}
