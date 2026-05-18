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
