import { record } from '@elysiajs/opentelemetry'
import { and, eq, ne, or, type SQL } from 'drizzle-orm'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'

import { ConflictError } from '@/core/http/errors'
import { db } from '@/db'

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

/**
 * Extracts field keys from either:
 *  - A string union: `'code' | 'name'`
 *  - An object type: `Pick<SomeDto, 'code' | 'name'>`
 */
type FieldKeys<T> = T extends string ? T : keyof T & string

export interface ConflictField<T = string> {
  /** The field key to check for uniqueness. */
  field: FieldKeys<T>
  /** The corresponding Drizzle column reference. */
  column: PgColumn
  /** Error message when this field conflicts. */
  message: string
  /** Optional error code (e.g. 'USER_EMAIL_ALREADY_EXISTS'). */
  code?: string
}

interface CheckConflictOptions<T = string> {
  /** The Drizzle table to query against. */
  table: PgTable
  /** The primary key column of the table (default serial `id`). */
  pkColumn: PgColumn
  /** The fields to check for uniqueness, with per-field error config. */
  fields: ConflictField<T>[]
  /** The input values to check (already normalized). Keyed by field names. */
  input: Record<FieldKeys<T>, unknown>
  /**
   * When updating, pass the existing record to:
   * 1. Skip unchanged fields
   * 2. Exclude the current record from the conflict query
   */
  existing?: { id: number } & Partial<Record<FieldKeys<T>, unknown>>
}

/* -------------------------------------------------------------------------- */
/*                               IMPLEMENTATION                               */
/* -------------------------------------------------------------------------- */

/**
 * Generic uniqueness conflict checker for Drizzle tables.
 *
 * Compares each configured field against the database. On update, it skips
 * fields that haven't changed and excludes the current record from the query.
 *
 * @example
 * await checkConflict({
 *   table: users,
 *   pkColumn: users.id,
 *   fields: [
 *     { field: 'email', column: users.email, message: 'Email already exists', code: 'USER_EMAIL_ALREADY_EXISTS' },
 *     { field: 'username', column: users.username, message: 'Username already exists', code: 'USER_USERNAME_ALREADY_EXISTS' },
 *   ],
 *   input: { email, username },
 *   existing, // optional, pass on update
 * })
 */
export async function checkConflict<T>(opts: CheckConflictOptions<T>): Promise<void> {
  return record('db.checkConflict', async () => {
    const { table, pkColumn, fields, input, existing } = opts

    // Determine which fields actually changed
    const changedFields = fields.filter((f) => {
      if (!existing) return true // create → always check
      return existing[f.field] !== input[f.field]
    })

    if (changedFields.length === 0) return

    // Build OR conditions with only changed fields
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const orConditions: SQL[] = changedFields.map((f) => eq(f.column, input[f.field] as never))

    // Combine: OR of field checks, AND exclude self on update
    const whereClause = existing ? and(ne(pkColumn, existing.id), or(...orConditions)) : or(...orConditions)!

    const [conflict] = await db.select().from(table).where(whereClause).limit(1)

    if (!conflict) return

    // Throw the first matching conflict
    const conflictRecord = conflict as Record<string, unknown>
    for (const f of changedFields) {
      if (conflictRecord[f.field] === input[f.field]) {
        throw new ConflictError(f.message, f.code)
      }
    }
  })
}
