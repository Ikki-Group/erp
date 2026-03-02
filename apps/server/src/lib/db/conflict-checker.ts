import type { Model } from 'mongoose'

import { ConflictError } from '@/lib/error/http'

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export interface ConflictField<TInput> {
  /** The field key to check for uniqueness. */
  field: keyof TInput & string
  /** Error message when this field conflicts. */
  message: string
  /** Optional error code (e.g. 'USER_EMAIL_ALREADY_EXISTS'). */
  code?: string
}

export interface CheckConflictOptions<TInput> {
  /** The Mongoose model to query against. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: Model<any>
  /** The fields to check for uniqueness, with per-field error config. */
  fields: ConflictField<TInput>[]
  /** The input values to check (already normalized). */
  input: TInput
  /**
   * When updating, pass the existing record to:
   * 1. Skip unchanged fields
   * 2. Exclude the current record from the conflict query
   */
  existing?: { id: ObjectId } & Partial<TInput>
}

/* -------------------------------------------------------------------------- */
/*                               IMPLEMENTATION                               */
/* -------------------------------------------------------------------------- */

/**
 * Generic uniqueness conflict checker for Mongoose models.
 *
 * Compares each configured field against the database. On update, it skips
 * fields that haven't changed and excludes the current document from the query.
 *
 * @example
 * // In a service:
 * await checkConflict({
 *   model: UserModel,
 *   fields: [
 *     { field: 'email', message: 'Email already exists', code: 'USER_EMAIL_ALREADY_EXISTS' },
 *     { field: 'username', message: 'Username already exists', code: 'USER_USERNAME_ALREADY_EXISTS' },
 *   ],
 *   input: { email, username },
 *   existing, // optional, pass on update
 * })
 */
export async function checkConflict<TInput extends Record<string, unknown>>(
  opts: CheckConflictOptions<TInput>
): Promise<void> {
  const { model, fields, input, existing } = opts

  // Determine which fields actually changed
  const changedFields = fields.filter((f) => {
    if (!existing) return true // create → always check
    return existing[f.field] !== input[f.field]
  })

  if (changedFields.length === 0) return

  // Build $or query with only changed fields
  const $or = changedFields.map((f) => ({ [f.field]: input[f.field] }))
  const filter = existing ? { _id: { $ne: existing.id }, $or } : { $or }

  // Select only the fields we need to check
  const selectFields = changedFields.map((f) => f.field).join(' ')
  const conflict = (await model.findOne(filter).select(selectFields).lean()) as Record<string, unknown> | null

  if (!conflict) return

  // Throw the first matching conflict
  for (const f of changedFields) {
    if (conflict[f.field] === input[f.field]) {
      throw new ConflictError(f.message, f.code)
    }
  }
}
