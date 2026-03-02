/**
 * Metadata stamp utilities for audit fields.
 *
 * **Immutable (spread):**
 * - `stampCreate`  — returns a plain object to spread into `new Model({ ...data, ...stampCreate(actorId) })`
 * - `stampUpdate`  — returns a plain object to spread into `Model.findByIdAndUpdate(id, { ...data, ...stampUpdate(actorId) })`
 *
 * **Mutable (assign):**
 * - `applyCreate`  — mutates a Mongoose document directly: `applyCreate(doc, actorId)`
 * - `applyUpdate`  — mutates a Mongoose document directly: `applyUpdate(doc, actorId)`
 *
 * Use the mutable variants when you need Mongoose to track individual dirty fields
 * for optimised partial updates, or when the document is constructed separately from
 * the metadata assignment.
 */

interface StampOptions {
  /** If true, sets `syncAt` to the current timestamp as well. */
  withSync?: boolean

  /** If provided, uses this timestamp instead of the current time. */
  now?: Date
}

/** Minimal shape a document must satisfy so the `apply*` helpers can assign metadata. */
interface MetadataDoc {
  createdBy: ObjectId
  updatedBy: ObjectId
  createdAt: Date
  updatedAt: Date
  syncAt?: Date | null
}

/* ----------------------------- IMMUTABLE (SPREAD) ----------------------------- */

/**
 * Returns metadata fields for a **CREATE** operation.
 *
 * @param actorId - The ID of the user performing the action (from `auth.userId`).
 * @param options - Optional flags (e.g. `withSync`).
 */
export function stampCreate(actorId: ObjectId, options?: StampOptions) {
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
 * @param actorId - The ID of the user performing the action (from `auth.userId`).
 * @param options - Optional flags (e.g. `withSync`).
 */
export function stampUpdate(actorId: ObjectId, options?: StampOptions) {
  const now = options?.now || new Date()
  return {
    updatedBy: actorId,
    updatedAt: now,
    ...(options?.withSync && { syncAt: now }),
  }
}

/* ------------------------------ MUTABLE (ASSIGN) ------------------------------ */

/**
 * Mutates a Mongoose document with **CREATE** metadata.
 * Sets `createdBy`, `updatedBy`, `createdAt`, `updatedAt` (and optionally `syncAt`)
 * directly on the document so Mongoose can track each field as dirty.
 *
 * @param doc     - The Mongoose document to mutate.
 * @param actorId - The ID of the user performing the action.
 * @param options - Optional flags (e.g. `withSync`).
 */
export function applyCreate<T extends MetadataDoc>(doc: T, actorId: ObjectId, options?: StampOptions): T {
  const now = options?.now || new Date()
  doc.createdBy = actorId
  doc.updatedBy = actorId
  doc.createdAt = now
  doc.updatedAt = now
  if (options?.withSync) doc.syncAt = now
  return doc
}

/**
 * Mutates a Mongoose document with **UPDATE** metadata.
 * Sets `updatedBy` and `updatedAt` (and optionally `syncAt`)
 * directly on the document so Mongoose can track each field as dirty.
 *
 * @param doc     - The Mongoose document to mutate.
 * @param actorId - The ID of the user performing the action.
 * @param options - Optional flags (e.g. `withSync`).
 */
export function applyUpdate<T extends MetadataDoc>(doc: T, actorId: ObjectId, options?: StampOptions): T {
  const now = options?.now || new Date()
  doc.updatedBy = actorId
  doc.updatedAt = now
  if (options?.withSync) doc.syncAt = now
  return doc
}
