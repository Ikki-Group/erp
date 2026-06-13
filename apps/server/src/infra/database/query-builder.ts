import { asc, desc, ilike, type AnyColumn, type SQL } from 'drizzle-orm'

/* -------------------------------------------------------------------------- */
/*                             SORTING HELPERS                                */
/* -------------------------------------------------------------------------- */

type SortDirection = 'asc' | 'desc'

/**
 * Returns a Drizzle orderBy clause for the given column and direction.
 *
 * @example
 * const orderBy = sortBy(users.updatedAt, 'desc')
 * db.select().from(users).orderBy(orderBy)
 */
export function sortBy(column: AnyColumn, direction: SortDirection = 'desc') {
	return direction === 'asc' ? asc(column) : desc(column)
}

/* -------------------------------------------------------------------------- */
/*                           SEARCH / FILTER HELPERS                          */
/* -------------------------------------------------------------------------- */

/**
 * Creates an `ILIKE` filter condition if the search term is non-empty.
 * Returns `undefined` if no search term, safe to pass into `.where()`.
 *
 * Special regex characters (`%`, `_`, `\`) are escaped so user input is
 * treated as a literal substring match rather than a wildcard pattern.
 *
 * @example
 * const where = searchFilter(users.email, query.search)
 * db.select().from(users).where(where)
 */
export function searchFilter(column: AnyColumn, search?: string): SQL | undefined {
	const term = search?.trim()
	if (!term) return undefined
	// oxlint-disable-next-line require-unicode-regexp
	const escaped = term.replace(/[\\%_]/g, '\\$&')
	return ilike(column, `%${escaped}%`)
}
