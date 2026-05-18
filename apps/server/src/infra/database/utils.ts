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

/**
 * Metadata stamp utilities for audit fields.
 *
 * **Immutable (spread):**
 * - `stampCreate`  — returns a plain object to spread into `{ ...data, ...stampCreate(actorId) }`
 * - `stampUpdate`  — returns a plain object to spread into `{ ...data, ...stampUpdate(actorId) }`
 *
 * All actor IDs are `number` (serial integer PK from the users table).
 */

interface StampOptions {
	/** If true, sets `syncAt` to the current timestamp as well. */
	withSync?: boolean
	now?: Date
}

interface CreateStamp {
	createdBy: number
	updatedBy: number
	createdAt: Date
	updatedAt: Date
	syncAt?: Date
}

interface UpdateStamp {
	updatedBy: number
	updatedAt: Date
	syncAt?: Date
}

function resolveNow(options?: StampOptions): Date {
	return options?.now ?? new Date()
}

/**
 * Returns metadata fields for a **CREATE** operation.
 */
export function stampCreate(actorId: number, options?: StampOptions): CreateStamp {
	const now = resolveNow(options)
	return {
		createdBy: actorId,
		updatedBy: actorId,
		createdAt: now,
		updatedAt: now,
		...(options?.withSync && { syncAt: now }),
	}
}

/**
 * Returns metadata fields for an **UPDATE** operation.
 */
export function stampUpdate(actorId: number, options?: StampOptions): UpdateStamp {
	const now = resolveNow(options)
	return {
		updatedBy: actorId,
		updatedAt: now,
		...(options?.withSync && { syncAt: now }),
	}
}
