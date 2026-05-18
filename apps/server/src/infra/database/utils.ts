import { NotFoundError } from '@/core/http/errors'

/**
 * Extracts the first result from an array, or returns undefined.
 * Convenient for Drizzle queries that return arrays.
 *
 * @example
 * const user = takeFirst(await db.select().from(users).where(eq(users.id, id)))
 */
export function takeFirst<T>(results: T[]): T | undefined {
	return results[0]
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
export function takeFirstOrThrow<T>(
	results: T[],
	message = 'Resource not found',
	code?: string,
): T {
	if (!results.length) throw new NotFoundError(message, code)
	return results[0]!
}
