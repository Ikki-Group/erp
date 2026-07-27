/**
 * Unit tests for `@/infra/database` helpers.
 *
 * Pure logic only — no database. Covers pagination math + window-count
 * extraction, WHERE composition (`allOf`/`anyOf`/`eqIf`), and the
 * constraint-based conflict translator (`catchUniqueViolation`).
 */

import {
	allOf,
	anyOf,
	buildPaginationMeta,
	catchUniqueViolation,
	eqIf,
	notDeleted,
	paginateWindow,
	toLimitOffset,
} from '@/infra/database'
import { ConflictError } from '@/shared/errors/http-error'

import { describe, expect, it } from 'bun:test'
import type { SQL } from 'drizzle-orm'

// Minimal SQL-ish sentinels for composition tests (identity by reference).
const A = { marker: 'A' } as unknown as SQL
const B = { marker: 'B' } as unknown as SQL

describe('pagination helpers', () => {
	it('buildPaginationMeta computes totalPages (ceil), 0 when empty', () => {
		expect(buildPaginationMeta(0, { page: 1, limit: 10 })).toEqual({
			total: 0,
			page: 1,
			limit: 10,
			totalPages: 0,
		})
		expect(buildPaginationMeta(21, { page: 2, limit: 10 }).totalPages).toBe(3)
	})

	it('toLimitOffset converts page/limit → limit/offset', () => {
		expect(toLimitOffset({ page: 1, limit: 10 })).toEqual({ limit: 10, offset: 0 })
		expect(toLimitOffset({ page: 3, limit: 25 })).toEqual({ limit: 25, offset: 50 })
	})

	it('paginateWindow reads total from the window column and strips it', () => {
		const rows = [
			{ id: 1, name: 'a', rowCount: 2 },
			{ id: 2, name: 'b', rowCount: 2 },
		]
		const result = paginateWindow(rows, { page: 1, limit: 10 })
		expect(result.meta.total).toBe(2)
		expect(result.data).toEqual([
			{ id: 1, name: 'a' },
			{ id: 2, name: 'b' },
		])
		// no leaked window column
		expect('rowCount' in result.data[0]!).toBe(false)
	})

	it('paginateWindow returns total 0 for an empty page', () => {
		const result = paginateWindow([] as { id: number; rowCount?: number }[], { page: 1, limit: 10 })
		expect(result.meta.total).toBe(0)
		expect(result.data).toEqual([])
	})
})

describe('where composition', () => {
	it('allOf drops falsy conditions', () => {
		expect(allOf(A, undefined, false, null, B)).toBeDefined()
		expect(allOf(undefined, false, null)).toBeUndefined()
	})

	it('anyOf drops falsy conditions', () => {
		expect(anyOf(undefined, A)).toBeDefined()
		expect(anyOf(undefined, null, false)).toBeUndefined()
	})

	it('eqIf returns undefined for null/undefined values', () => {
		expect(eqIf({} as never, undefined)).toBeUndefined()
		expect(eqIf({} as never, null)).toBeUndefined()
	})

	it('notDeleted returns an isNull condition (defined SQL)', () => {
		// PgColumn shape isn't needed at runtime for isNull() to produce SQL.
		expect(notDeleted({ name: 'deleted_at' } as never)).toBeDefined()
	})
})

describe('catchUniqueViolation', () => {
	const pgError = (constraint: string) =>
		Object.assign(new Error('dup'), { code: '23505', constraint })

	it('passes through the result when no error', () => {
		expect(catchUniqueViolation(() => Promise.resolve(42), [])).resolves.toBe(42)
	})

	it('maps a matched constraint → typed ConflictError', () => {
		const promise = catchUniqueViolation(
			() => Promise.reject(pgError('users_email_unique')),
			[{ constraint: 'users_email_unique', message: 'Email exists', code: 'USER_EMAIL_EXISTS' }],
		)
		expect(promise).rejects.toBeInstanceOf(ConflictError)
	})

	it('throws a generic ConflictError for an unmapped 23505', () => {
		const promise = catchUniqueViolation(() => Promise.reject(pgError('some_other_idx')), [])
		expect(promise).rejects.toBeInstanceOf(ConflictError)
	})

	it('re-throws non-unique errors untouched', () => {
		const other = new Error('boom')
		expect(catchUniqueViolation(() => Promise.reject(other), [])).rejects.toBe(other)
	})
})
