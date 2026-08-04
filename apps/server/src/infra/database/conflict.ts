import { and, eq, ne, type SQL } from 'drizzle-orm'

import { withSpan } from '@/infra/otel'
import { ConflictError } from '@/shared/errors/http-error'

import type { DbContext } from './types'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export interface ConflictField<T extends Record<string, unknown> = Record<string, unknown>> {
	field: keyof T & string
	column: PgColumn
	message: string
	code?: string
}

/**
 * Type-safe conflict field builder. Constrains `field` to keys of `T`.
 *
 * @example
 * const fields = defineConflictFields<LocationCreateSchema>()([
 *   { field: 'name', column: locationsTable.name, message: '...', code: '...' },
 *   { field: 'code', column: locationsTable.code, message: '...', code: '...' },
 * ])
 */
export function defineConflictFields<T extends Record<string, unknown>>() {
	return <F extends ConflictField<T>[]>(fields: F): F => fields
}

export interface CheckConflictOptions<T extends Record<string, unknown> = Record<string, unknown>> {
	db: DbContext
	table: PgTable
	pkColumn: PgColumn
	fields: ConflictField<T>[]
	input: T
	existing?: { id: string | number } & Partial<T>
}

export interface ConstraintConflict {
	constraint: string
	message: string
	code?: string
}

/* -------------------------------------------------------------------------- */
/*                     PRE-CHECK (SELECT-BEFORE-WRITE)                        */
/* -------------------------------------------------------------------------- */

/**
 * Pre-write uniqueness check. Throws `ConflictError` if a field conflicts.
 *
 * Checks each changed field with a SELECT query. Skips fields whose value
 * hasn't changed from `existing` (safe for updates).
 *
 * @example
 * await checkConflict({ db: this.repo.db, table, pkColumn, fields, input, existing })
 */
export async function checkConflict<T extends Record<string, unknown>>(
	opts: CheckConflictOptions<T>,
): Promise<void> {
	return withSpan('db.checkConflict', async () => {
		const { db, table, pkColumn, fields, input, existing } = opts

		const changedFields = fields.filter((f) => !existing || existing[f.field] !== input[f.field])
		if (changedFields.length === 0) return

		for (const f of changedFields) {
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion
			const fieldMatch = eq(f.column, input[f.field] as never)
			const where: SQL = existing ? and(ne(pkColumn, existing.id), fieldMatch)! : fieldMatch

			const [conflict] = await db.select({ id: pkColumn }).from(table).where(where).limit(1)

			if (conflict) {
				throw new ConflictError(f.message, { code: f.code ?? 'CONFLICT_FIELD' })
			}
		}
	})
}

/* -------------------------------------------------------------------------- */
/*                   CONSTRAINT-BASED (CATCH-ON-WRITE)                        */
/* -------------------------------------------------------------------------- */

const PG_UNIQUE_VIOLATION = '23505'

interface PgError {
	code?: string
	constraint?: string
	detail?: string
	message?: string
}

function asPgError(err: unknown): PgError | undefined {
	if (typeof err !== 'object' || err === null) return undefined
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	const e = err as PgError
	return typeof e.code === 'string' ? e : undefined
}

/**
 * Wraps a write and catches Postgres `unique_violation` (23505).
 * Throws `ConflictError` if the violated constraint matches `map`.
 * Unmatched 23505 errors still throw a generic `ConflictError`.
 * Non-unique errors are re-thrown untouched.
 *
 * @example
 * const result = await catchUniqueViolation(
 *   () => this.repo.insert(data),
 *   [{ constraint: 'users_email_unique', message: 'Email exists', code: 'USER_EMAIL_EXISTS' }],
 * )
 */
export async function catchUniqueViolation<T>(
	fn: () => Promise<T>,
	map: ConstraintConflict[],
): Promise<T> {
	try {
		return await fn()
	} catch (err) {
		const pg = asPgError(err)
		if (pg?.code !== PG_UNIQUE_VIOLATION) throw err

		const matched = map.find((m) => pg.constraint === m.constraint)
		if (matched) {
			throw new ConflictError(matched.message, { code: matched.code ?? 'CONFLICT_FIELD' })
		}
		throw new ConflictError('Resource already exists', { code: 'CONFLICT_FIELD' })
	}
}
