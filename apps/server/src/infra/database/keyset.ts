import { desc, sql } from 'drizzle-orm'

import { BadRequestError } from '@/shared/errors/http-error.ts'
import type { CursorQuery, WithCursorResult } from '@/shared/types/pagination.ts'

import type { SQL } from 'drizzle-orm'
import type { PgColumn } from 'drizzle-orm/pg-core'

/**
 * Keyset (cursor) pagination over `(timestamp desc, id desc)`.
 *
 * The cursor is base64url JSON of the last row's sort key `[timestamp, id]`. The timestamp is
 * rendered by Postgres at microsecond precision (UTC ISO): a JS `Date` keeps only milliseconds,
 * so a millisecond cursor would skip or repeat rows that differ below the millisecond.
 */

/** Sort key of the last row on a page: microsecond UTC ISO timestamp + id tiebreaker. */
type KeysetKey = readonly [timestamp: string, id: number]

/** Rows passed to `page()` must select `cursorKey: sortKey` and the tiebreaker `id`. */
interface KeysetRow {
	cursorKey: string
	id: number
}

interface KeysetColumns {
	/** `timestamp with time zone` column sorted descending. */
	timestamp: PgColumn
	/** Unique integer tiebreaker, sorted descending. */
	id: PgColumn
}

const ISO_MICROS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/u

function invalidCursor(): BadRequestError {
	return new BadRequestError('Invalid pagination cursor', { code: 'INVALID_CURSOR' })
}

/** Decodes and validates an opaque cursor; throws 400 `INVALID_CURSOR` on anything malformed. */
function decodeCursor(cursor: string): KeysetKey {
	let parsed: unknown
	try {
		parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'))
	} catch {
		throw invalidCursor()
	}
	if (!Array.isArray(parsed) || parsed.length !== 2) throw invalidCursor()
	const timestamp: unknown = parsed[0]
	const id: unknown = parsed[1]
	if (typeof timestamp !== 'string' || !ISO_MICROS.test(timestamp)) throw invalidCursor()
	// Round-trip rejects out-of-range fields that `Date` would roll over (e.g. Feb 30).
	const parsedTime = new Date(timestamp)
	if (
		Number.isNaN(parsedTime.getTime()) ||
		parsedTime.toISOString().slice(0, 23) !== timestamp.slice(0, 23)
	) {
		throw invalidCursor()
	}
	if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) throw invalidCursor()
	return [timestamp, id]
}

/**
 * Builds the pieces of one keyset page query. Usage:
 *
 * ```ts
 * const page = keyset(filter, { timestamp: t.createdAt, id: t.id })
 * const rows = await db
 *   .select({ ...columns, cursorKey: page.sortKey })
 *   .from(t)
 *   .where(allOf(filterWhere, page.where))
 *   .orderBy(...page.orderBy)
 *   .limit(page.limit)
 * return page.page(rows, toDto)
 * ```
 *
 * Decoding happens eagerly, so a malformed cursor fails before any query runs.
 */
export function keyset(query: CursorQuery, columns: KeysetColumns) {
	const after = query.cursor === undefined ? undefined : decodeCursor(query.cursor)

	return {
		sortKey: sql<string>`to_char(${columns.timestamp} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`,

		/** Rows strictly after the cursor in `(timestamp desc, id desc)` order. */
		where: after
			? sql`(${columns.timestamp}, ${columns.id}) < (${after[0]}::timestamptz, ${after[1]}::integer)`
			: undefined,

		orderBy: keysetOrderBy(columns),

		/** One extra row reveals whether a next page exists. */
		limit: query.limit + 1,

		page<TRow extends KeysetRow, TDto>(
			rows: TRow[],
			toDto: (row: TRow) => TDto,
		): WithCursorResult<TDto> {
			const pageRows = rows.slice(0, query.limit)
			const last = pageRows.at(-1)
			const nextKey: KeysetKey | undefined =
				rows.length > query.limit && last ? [last.cursorKey, last.id] : undefined
			const nextCursor = nextKey ? Buffer.from(JSON.stringify(nextKey)).toString('base64url') : null
			return { data: pageRows.map(toDto), meta: { nextCursor, limit: query.limit } }
		},
	}
}

/** The keyset order; offset lists over the same columns use it too so both agree row-for-row. */
export function keysetOrderBy(columns: KeysetColumns): SQL[] {
	return [desc(columns.timestamp), desc(columns.id)]
}
