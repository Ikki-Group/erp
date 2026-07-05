import { and, eq, ne, type SQL } from 'drizzle-orm'

import { logger } from '@/infra/logger'
import { withSpan } from '@/infra/otel'
import { ConflictError } from '@/shared/errors/http-error'

import type { DbContext } from './types'
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
	/**
	 * The database context to run conflict queries against. Pass the caller's
	 * repo `db` (or an open transaction handle) so the uniqueness read runs in
	 * the same scope as the subsequent write. Required — no implicit global
	 * fallback, which prevents conflict reads from silently escaping a caller's
	 * transaction.
	 */
	db: DbContext
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
/*                     PRE-CHECK (SELECT-BEFORE-WRITE)                        */
/* -------------------------------------------------------------------------- */

/**
 * Generic uniqueness conflict checker for Drizzle tables (read-before-write).
 *
 * Each changed field is queried independently so conflict attribution is always
 * accurate — regardless of case sensitivity, value transforms, or multiple
 * simultaneous conflicts. On update, skips unchanged fields and excludes the
 * current record via `ne(pkColumn, existing.id)`.
 *
 * Best for giving the client a precise, per-field error message. For a strict
 * race-free guarantee, back it with a DB unique constraint and also wrap the
 * write in {@link catchUniqueViolation}.
 *
 * @example
 * await checkConflict({
 *   db: this.repo.db,
 *   table: users,
 *   pkColumn: users.id,
 *   fields: [
 *     { field: 'email', column: users.email, message: 'Email already exists', code: 'USER_EMAIL_ALREADY_EXISTS' },
 *     { field: 'username', column: users.username, message: 'Username already exists', code: 'USER_USERNAME_ALREADY_EXISTS' },
 *   ],
 *   input: { email, username },
 *   existing, // optional, on update
 * })
 */
export async function checkConflict<T extends Record<string, unknown>>(
	opts: CheckConflictOptions<T>,
): Promise<void> {
	return withSpan('db.checkConflict', async () => {
		const { db, table, pkColumn, fields, input, existing } = opts

		const changedFields = fields.filter((f) => !existing || existing[f.field] !== input[f.field])
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
				logger.warn('Conflict detected on field {field}', { field: f.field, value: input[f.field] })
				throw new ConflictError(f.message, { code: f.code ?? 'CONFLICT_FIELD' })
			}
		}
	})
}

/* -------------------------------------------------------------------------- */
/*                   CONSTRAINT-BASED (CATCH-ON-WRITE)                        */
/* -------------------------------------------------------------------------- */

/** Postgres `unique_violation` SQLSTATE. */
const PG_UNIQUE_VIOLATION = '23505'

/** Shape of a Postgres driver error we care about (bun-sql / node-postgres). */
interface PgError {
	code?: string
	constraint?: string
	detail?: string
	message?: string
}

function asPgError(err: unknown): PgError | undefined {
	if (typeof err !== 'object' || err === null) return undefined
	const e = err as PgError
	return typeof e.code === 'string' ? e : undefined
}

/** Map a DB constraint name → the ConflictError to throw when it is violated. */
export interface ConstraintConflict {
	/** The unique constraint / index name as defined in the schema. */
	constraint: string
	/** Client-facing message. */
	message: string
	/** Optional error code. */
	code?: string
}

/**
 * Run a write and translate a Postgres `unique_violation` (23505) into a typed
 * {@link ConflictError}, matched by constraint name.
 *
 * This is the race-free counterpart to {@link checkConflict}: the database is
 * the single source of truth, so two concurrent inserts can't both slip through
 * a read-before-write gap. Use it when the table has real unique constraints.
 *
 * If the violated constraint isn't in `map`, a generic `ConflictError` is
 * thrown (still 409) rather than leaking a 500.
 *
 * @example
 * return catchUniqueViolation(
 *   () => this.repo.insert(data),
 *   [
 *     { constraint: 'users_email_unique', message: 'Email already exists', code: 'USER_EMAIL_ALREADY_EXISTS' },
 *     { constraint: 'users_username_unique', message: 'Username already exists', code: 'USER_USERNAME_ALREADY_EXISTS' },
 *   ],
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
		logger.warn('Unique violation on constraint {constraint}', {
			constraint: pg.constraint,
			detail: pg.detail,
		})
		if (matched) throw new ConflictError(matched.message, { code: matched.code ?? 'CONFLICT_FIELD' })
		throw new ConflictError('Resource already exists', { code: 'CONFLICT_FIELD' })
	}
}
