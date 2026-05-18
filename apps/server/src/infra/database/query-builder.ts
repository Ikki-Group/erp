import { record } from '@elysiajs/opentelemetry'
import { asc, desc, ilike, type AnyColumn, type SQL } from 'drizzle-orm'

import type { PaginationQuery, WithPaginationResult } from '@/core/database/pagination'

/* -------------------------------------------------------------------------- */
/*                              PAGINATED QUERY                               */
/* -------------------------------------------------------------------------- */

interface PaginateOptions<TResult> {
	/**
	 * A function that receives `{ limit, offset }` and returns the data query promise.
	 * This allows the caller to apply limit/offset directly on any Drizzle query type
	 * (select, relational, etc.) without type compatibility issues.
	 *
	 * @example
	 * data: ({ limit, offset }) =>
	 *   db.select().from(users).where(where).orderBy(...).limit(limit).offset(offset)
	 */
	data: (params: { limit: number; offset: number }) => Promise<TResult[]>

	/** Pagination parameters (page, limit). */
	pq: PaginationQuery

	/**
	 * A thunk returning the count query, evaluated lazily inside `paginate` so
	 * both queries fire concurrently via `Promise.all`.
	 * Pass a `() => db.select({ count: count() }).from(table).where(...)` query.
	 */
	countQuery: () => Promise<{ count: string | number }[]>
}

/**
 * Runs data + count queries in parallel and returns paginated result.
 *
 * @example
 * const result = await paginate({
 *   data: ({ limit, offset }) =>
 *     db.select().from(users).where(where).orderBy(desc(users.updatedAt)).limit(limit).offset(offset),
 *   pq: { page: 1, limit: 10 },
 *   countQuery: () => db.select({ count: count() }).from(users).where(where),
 * })
 * // result.data = User[]
 * // result.meta = { total, page, limit, totalPages }
 */
export async function paginate<TResult>({
	data: dataFn,
	pq,
	countQuery,
}: PaginateOptions<TResult>): Promise<WithPaginationResult<TResult>> {
	return record('db.paginate', async () => {
		const page = pq.page
		const limit = pq.limit
		const offset = (page - 1) * limit

		// Run data + count in parallel
		const [data, countResult] = await Promise.all([dataFn({ limit, offset }), countQuery()])

		const total = Number(countResult[0]?.count ?? 0)
		const totalPages = total === 0 ? 0 : Math.ceil(total / limit)

		return { data, meta: { total, page, limit, totalPages } }
	})
}

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
/*                            SEARCH / FILTER HELPERS                         */
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
