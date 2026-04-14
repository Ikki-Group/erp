import { NotFoundError } from '@/core/http/errors'

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
