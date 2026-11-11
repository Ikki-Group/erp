import type { HttpError } from '@/shared/errors/http-error.ts'
import {
	ConflictError,
	ServiceUnavailableError,
	UnprocessableEntityError,
} from '@/shared/errors/http-error.ts'

/** Subset of node-postgres `DatabaseError` fields we rely on. */
export interface PgDriverError {
	code: string
	constraint?: string
	table?: string
}

export const PG_UNIQUE_VIOLATION = '23505'
const PG_FOREIGN_KEY_VIOLATION = '23503'
const PG_CHECK_VIOLATION = '23514'
const PG_DEADLOCK_DETECTED = '40P01'
const PG_SERIALIZATION_FAILURE = '40001'

const RETRYABLE_CODES = new Set([PG_DEADLOCK_DETECTED, PG_SERIALIZATION_FAILURE])

function isPgDriverError(value: unknown): value is PgDriverError {
	return (
		typeof value === 'object' &&
		value !== null &&
		'code' in value &&
		typeof value.code === 'string' &&
		/^[0-9A-Z]{5}$/u.test(value.code)
	)
}

/** Walks the `cause` chain (drizzle wraps driver errors in DrizzleQueryError). */
export function findPgError(error: unknown): PgDriverError | undefined {
	let current: unknown = error
	for (let depth = 0; depth < 10 && current; depth++) {
		if (isPgDriverError(current)) return current
		current = typeof current === 'object' && 'cause' in current ? current.cause : undefined
	}
	return undefined
}

export function isRetryablePgError(error: unknown): boolean {
	const pg = findPgError(error)
	return pg !== undefined && RETRYABLE_CODES.has(pg.code)
}

/**
 * Maps a PG constraint/concurrency error to an HttpError. Context only carries
 * the constraint/table names — never SQL text or bound parameters.
 */
export function toHttpError(error: unknown): HttpError | undefined {
	const pg = findPgError(error)
	if (!pg) return undefined
	const context = {
		...(pg.constraint && { constraint: pg.constraint }),
		...(pg.table && { table: pg.table }),
	}
	switch (pg.code) {
		case PG_UNIQUE_VIOLATION:
			return new ConflictError('A record with the same unique value already exists', {
				code: 'CONFLICT',
				context,
			})
		case PG_FOREIGN_KEY_VIOLATION:
			return new ConflictError('The record is referenced by or references missing data', {
				code: 'REFERENCE_CONFLICT',
				context,
			})
		case PG_CHECK_VIOLATION:
			return new UnprocessableEntityError('The record violates a data constraint', {
				code: 'CHECK_VIOLATION',
				context,
			})
		case PG_DEADLOCK_DETECTED:
		case PG_SERIALIZATION_FAILURE:
			return new ServiceUnavailableError('The database is busy, please retry', {
				code: 'RETRY_LATER',
			})
		default:
			return undefined
	}
}
