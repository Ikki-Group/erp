import { and, asc, desc, eq, ilike, isNull, or, sql, type AnyColumn, type SQL } from 'drizzle-orm'

import type { DbContext } from './types'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'

/* -------------------------------------------------------------------------- */
/*                                  SORTING                                   */
/* -------------------------------------------------------------------------- */

export type SortDirection = 'asc' | 'desc'

/**
 * Drizzle orderBy clause for a column + direction (defaults to `desc`).
 *
 * @example
 * db.select().from(users).orderBy(sortBy(users.updatedAt, 'desc'))
 */
export function sortBy(column: AnyColumn, direction: SortDirection = 'desc'): SQL {
	return direction === 'asc' ? asc(column) : desc(column)
}

/* -------------------------------------------------------------------------- */
/*                              WHERE COMPOSITION                             */
/* -------------------------------------------------------------------------- */

/**
 * Combine conditions with `AND`, dropping any `undefined` (so optional filters
 * can be inlined). Returns `undefined` when nothing is left — safe for `.where()`.
 *
 * @example
 * const where = allOf(
 *   isNull(users.deletedAt),
 *   status && eq(users.status, status), // skipped when falsy
 * )
 */
export function allOf(...conditions: (SQL | undefined | false | null)[]): SQL | undefined {
	return and(...conditions.filter((c): c is SQL => Boolean(c)))
}

/**
 * Combine conditions with `OR`, dropping any `undefined`. Returns `undefined`
 * when nothing is left.
 */
export function anyOf(...conditions: (SQL | undefined | false | null)[]): SQL | undefined {
	return or(...conditions.filter((c): c is SQL => Boolean(c)))
}

/* -------------------------------------------------------------------------- */
/*                             SEARCH / FILTERS                               */
/* -------------------------------------------------------------------------- */

/**
 * Case-insensitive `ILIKE '%term%'` filter, or `undefined` when the term is
 * empty. Escapes `%`, `_`, `\` so user input is a literal substring, never a
 * wildcard pattern.
 *
 * @example
 * const where = searchFilter(users.email, query.q)
 */
export function searchFilter(column: AnyColumn, search?: string | null): SQL | undefined {
	const term = search?.trim()
	if (!term) return undefined
	// oxlint-disable-next-line require-unicode-regexp
	const escaped = term.replace(/[\\%_]/g, '\\$&')
	return ilike(column, `%${escaped}%`)
}

/**
 * `ILIKE` search across MULTIPLE columns, OR-ed together. Returns `undefined`
 * when the term is empty.
 *
 * @example
 * const where = searchAcross(query.q, [users.name, users.email, users.username])
 */
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

/**
 * Whether at least one row in `table` matches `where`. Uses `LIMIT 1` so it
 * stops at the first hit.
 *
 * @example
 * if (await existsWhere(db, users, eq(users.email, email))) throw ...
 */
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

/**
 * Count rows in `table` matching `where` (0 when none).
 *
 * @example
 * const active = await countWhere(db, users, eq(users.isActive, true))
 */
export async function countWhere(
	db: DbContext,
	table: PgTable,
	where?: SQL,
): Promise<number> {
	const [row] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(table)
		.where(where)
	return Number(row?.count ?? 0)
}

/* -------------------------------------------------------------------------- */
/*                                 EQUALITY                                   */
/* -------------------------------------------------------------------------- */

/**
 * `eq(column, value)` when `value` is defined, else `undefined` — for inlining
 * optional equality filters inside {@link allOf}.
 *
 * @example
 * allOf(eqIf(users.locationId, filter.locationId), eqIf(users.isActive, filter.isActive))
 */
export function eqIf<T>(column: PgColumn, value: T | undefined | null): SQL | undefined {
	return value === undefined || value === null ? undefined : eq(column, value)
}

/* -------------------------------------------------------------------------- */
/*                                SOFT DELETE                                 */
/* -------------------------------------------------------------------------- */

/**
 * "Row is not soft-deleted" condition — `isNull(deletedAt)`. Compose it into a
 * `where` with {@link allOf} so soft-deleted rows are excluded consistently.
 *
 * @example
 * const where = allOf(notDeleted(recipes.deletedAt), eqIf(recipes.materialId, materialId))
 */
export function notDeleted(deletedAtColumn: PgColumn): SQL {
	return isNull(deletedAtColumn)
}
