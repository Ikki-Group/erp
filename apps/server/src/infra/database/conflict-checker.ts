import { record } from '@elysiajs/opentelemetry'
import { and, eq, ne, type SQL } from 'drizzle-orm'

import { logger } from '@/core/logger'

import { db } from '@/db'

import { ConflictError } from '@/shared/errors/http-error'

import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export interface ConflictField<T extends Record<string, unknown> = Record<string, unknown>> {
	/** The field key to check for uniqueness. */
	field: keyof T & string
	/** The corresponding Drizzle column reference. */
	column: PgColumn
	/** Error message when this field conflicts. */
	message: string
	/** Optional error code (e.g. 'USER_EMAIL_ALREADY_EXISTS'). */
	code?: string
}

interface CheckConflictOptions<T extends Record<string, unknown> = Record<string, unknown>> {
	/** The Drizzle table to query against. */
	table: PgTable
	/** The primary key column of the table (default serial `id`). */
	pkColumn: PgColumn
	/** The fields to check for uniqueness, with per-field error config. */
	fields: ConflictField<T>[]
	/** The input values to check (already normalized). Keyed by field names. */
	input: T
	/**
	 * When updating, pass the existing record's id and current field values to:
	 * 1. Skip unchanged fields
	 * 2. Exclude the current record from each conflict query
	 */
	existing?: { id: string | number } & Partial<T>
}

/* -------------------------------------------------------------------------- */
/*                               IMPLEMENTATION                               */
/* -------------------------------------------------------------------------- */

/**
 * Generic uniqueness conflict checker for Drizzle tables.
 *
 * Each changed field is queried independently so conflict attribution is
 * always accurate — regardless of case sensitivity, value transforms, or
 * multiple simultaneous conflicts.
 *
 * On update, skips fields that haven't changed and excludes the current
 * record from every conflict query via `ne(pkColumn, existing.id)`.
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
export async function checkConflict<T extends Record<string, unknown>>(
	opts: CheckConflictOptions<T>,
): Promise<void> {
	return record('db.checkConflict', async () => {
		const { table, pkColumn, fields, input, existing } = opts

		// Determine which fields actually changed
		const changedFields = fields.filter((f) => {
			if (!existing) return true
			return existing[f.field] !== input[f.field]
		})

		if (changedFields.length === 0) return

		// Query each changed field independently for accurate conflict attribution.
		// Value-comparison post-query is unreliable (case-insensitive columns,
		// stored transforms, simultaneous multi-field conflicts).
		for (const f of changedFields) {
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion
			const fieldMatch = eq(f.column, input[f.field] as never)
			const where: SQL = existing ? and(ne(pkColumn, existing.id), fieldMatch)! : fieldMatch

			const [conflict] = await db.select({ id: pkColumn }).from(table).where(where).limit(1)

			if (conflict) {
				logger.warn('Conflict detected on field {field}', {
					field: f.field,
					value: input[f.field],
				})
				throw new ConflictError(f.message, f.code)
			}
		}
	})
}
