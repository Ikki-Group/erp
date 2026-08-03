import { and, asc, desc, eq, ilike, isNull, or, sql, type AnyColumn, type SQL } from 'drizzle-orm'

import type { DbContext } from './types'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'

/* -------------------------------------------------------------------------- */
/*                                  SORTING                                   */
/* -------------------------------------------------------------------------- */

export type SortDirection = 'asc' | 'desc'

/** OrderBy clause for a column + direction. */
export function sortBy(column: AnyColumn, direction: SortDirection = 'desc'): SQL {
	return direction === 'asc' ? asc(column) : desc(column)
}

/* -------------------------------------------------------------------------- */
/*                              WHERE COMPOSITION                             */
/* -------------------------------------------------------------------------- */

/**
 * AND combiner that drops falsy conditions. Safe for `.where()`.
 *
 * @example
 * const where = allOf(
 *   searchAcross(filter.q, [users.name, users.email]),
 *   eqIf(users.locationId, filter.locationId),
 * )
 */
export function allOf(...conditions: (SQL | undefined | false | null)[]): SQL | undefined {
	return and(...conditions.filter((c): c is SQL => Boolean(c)))
}

/** OR combiner that drops falsy conditions. */
export function anyOf(...conditions: (SQL | undefined | false | null)[]): SQL | undefined {
	return or(...conditions.filter((c): c is SQL => Boolean(c)))
}

/* -------------------------------------------------------------------------- */
/*                             SEARCH / FILTERS                               */
/* -------------------------------------------------------------------------- */

/** Case-insensitive ILIKE filter. Returns `undefined` when term is empty. */
export function searchFilter(column: AnyColumn, search?: string | null): SQL | undefined {
	const term = search?.trim()
	if (!term) return undefined
	// oxlint-disable-next-line require-unicode-regexp
	const escaped = term.replace(/[\\%_]/g, '\\$&')
	return ilike(column, `%${escaped}%`)
}

/** ILIKE search OR-ed across multiple columns. */
export function searchAcross(
	search: string | null | undefined,
	columns: AnyColumn[],
): SQL | undefined {
	const term = search?.trim()
	if (!term) return undefined
	return anyOf(...columns.map((c) => searchFilter(c, term)))
}

/* -------------------------------------------------------------------------- */
/*                          EXISTENCE / COUNT PROBES                          */
/* -------------------------------------------------------------------------- */

/** Returns true if at least one row matches. Uses LIMIT 1. */
export async function existsWhere(
	db: DbContext,
	table: PgTable,
	where: SQL | undefined,
): Promise<boolean> {
	const [row] = await db
		.select({ one: sql<number>`1` })
		.from(table)
		.where(where)
		.limit(1)
	return row !== undefined
}

/** Count rows matching `where` (0 when none). */
export async function countWhere(db: DbContext, table: PgTable, where?: SQL): Promise<number> {
	const [row] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(table)
		.where(where)
	return Number(row?.count ?? 0)
}

/* -------------------------------------------------------------------------- */
/*                                 EQUALITY                                   */
/* -------------------------------------------------------------------------- */

/** `eq(column, value)` when value is defined, else `undefined`. For optional filters. */
export function eqIf<T>(column: PgColumn, value: T | undefined | null): SQL | undefined {
	return value === undefined || value === null ? undefined : eq(column, value)
}

/* -------------------------------------------------------------------------- */
/*                                SOFT DELETE                                 */
/* -------------------------------------------------------------------------- */

/** `isNull(deletedAt)` — filter for non-deleted rows. */
export function notDeleted(deletedAtColumn: PgColumn): SQL {
	return isNull(deletedAtColumn)
}
