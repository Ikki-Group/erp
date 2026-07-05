import { withSpan } from '@/infra/otel'

import type { PaginationQuery, WithPaginationResult } from '@/shared/types/pagination'

/* -------------------------------------------------------------------------- */
/*                              PAGINATED QUERY                               */
/* -------------------------------------------------------------------------- */

interface PaginateOptions<TResult> {
	/**
	 * Receives `{ limit, offset }` and returns the data query promise. Applying
	 * limit/offset here (rather than inside `paginate`) lets the caller use any
	 * Drizzle query shape (select, relational, joins) without type friction.
	 *
	 * @example
	 * data: ({ limit, offset }) =>
	 *   db.select().from(users).where(where).orderBy(...).limit(limit).offset(offset)
	 */
	data: (params: { limit: number; offset: number }) => Promise<TResult[]>

	/** Pagination parameters (page, limit). */
	pq: PaginationQuery

	/**
	 * Thunk returning the count query, evaluated lazily so it can fire
	 * concurrently with the data query via `Promise.all`.
	 *
	 * @example
	 * countQuery: () => db.select({ count: count() }).from(users).where(where)
	 */
	countQuery: () => Promise<{ count: string | number }[]>
}

/** Compute pagination metadata from a total row count. */
export function buildPaginationMeta(total: number, pq: PaginationQuery) {
	return {
		total,
		page: pq.page,
		limit: pq.limit,
		totalPages: total === 0 ? 0 : Math.ceil(total / pq.limit),
	}
}

/** Convert `{ page, limit }` into a SQL `{ limit, offset }`. */
export function toLimitOffset(pq: PaginationQuery): { limit: number; offset: number } {
	return { limit: pq.limit, offset: (pq.page - 1) * pq.limit }
}

/**
 * Runs a data query and a count query in parallel and returns a paginated
 * result (`{ data, meta }`).
 *
 * Use this when the count query differs from the data query (joins, DISTINCT,
 * grouped counts). If your count is a plain `count(*)` over the same `where`,
 * prefer {@link paginateWindow} — it needs only ONE round-trip.
 *
 * @example
 * const result = await paginate({
 *   data: ({ limit, offset }) =>
 *     db.select().from(users).where(where).orderBy(desc(users.updatedAt)).limit(limit).offset(offset),
 *   pq: filter,
 *   countQuery: () => db.select({ count: count() }).from(users).where(where),
 * })
 */
export async function paginate<TResult>({
	data,
	pq,
	countQuery,
}: PaginateOptions<TResult>): Promise<WithPaginationResult<TResult>> {
	return withSpan('db.paginate', async () => {
		const [rows, countResult] = await Promise.all([data(toLimitOffset(pq)), countQuery()])
		const total = Number(countResult[0]?.count ?? 0)
		return { data: rows, meta: buildPaginationMeta(total, pq) }
	})
}

/* -------------------------------------------------------------------------- */
/*                        SINGLE-ROUND-TRIP PAGINATION                        */
/* -------------------------------------------------------------------------- */

/** The reserved column name carrying the total via `count(*) OVER()`. */
export const WINDOW_COUNT_KEY = 'rowCount' as const

/** A row that carries the total via a `count(*) OVER()` window column. */
type WindowCountRow = { readonly [WINDOW_COUNT_KEY]?: string | number | null }

/**
 * Single-query pagination using a `count(*) OVER()` window column.
 *
 * The caller selects an extra `rowCount: sql\`count(*) over()\`` alongside the
 * normal columns; `paginateWindow` reads the total from the first row and
 * strips `rowCount` from the returned data. This trades a second round-trip for
 * a slightly heavier single query — usually a win on network-bound setups (Neon).
 *
 * `total` is `0` when there are no rows (the window column only exists on
 * returned rows), which is correct for an empty page-1 result.
 *
 * @example
 * const rows = await db
 *   .select({ ...getTableColumns(users), rowCount: sql<number>`count(*) over()` })
 *   .from(users).where(where).orderBy(desc(users.updatedAt))
 *   .limit(limit).offset(offset)
 * return paginateWindow(rows, pq)
 */
export function paginateWindow<TRow extends WindowCountRow>(
	rows: TRow[],
	pq: PaginationQuery,
): WithPaginationResult<Omit<TRow, typeof WINDOW_COUNT_KEY>> {
	const total = Number(rows[0]?.[WINDOW_COUNT_KEY] ?? 0)
	const data = rows.map((row) => {
		const { [WINDOW_COUNT_KEY]: _drop, ...rest } = row
		return rest
	})
	return { data, meta: buildPaginationMeta(total, pq) }
}
