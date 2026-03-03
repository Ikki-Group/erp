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

  /** If provided, uses this timestamp instead of the current time. */
  now?: Date
}

/* ----------------------------- IMMUTABLE (SPREAD) ----------------------------- */

/**
 * Returns metadata fields for a **CREATE** operation.
 *
 * @param actorId - The integer ID of the user performing the action (from `auth.userId`).
 * @param options - Optional flags (e.g. `withSync`).
 */
export function stampCreate(actorId: number, options?: StampOptions) {
  const now = options?.now || new Date()
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
 *
 * @param actorId - The integer ID of the user performing the action (from `auth.userId`).
 * @param options - Optional flags (e.g. `withSync`).
 */
export function stampUpdate(actorId: number, options?: StampOptions) {
  const now = options?.now || new Date()
  return {
    updatedBy: actorId,
    updatedAt: now,
    ...(options?.withSync && { syncAt: now }),
  }
}
