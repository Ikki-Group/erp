import { record } from '@elysiajs/opentelemetry'

import type { PaginationQuery, WithPaginationResult } from '@/shared/types/pagination'
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
