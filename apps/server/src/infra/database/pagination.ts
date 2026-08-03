import { withSpan } from '@/infra/otel'
import type { PaginationQuery, WithPaginationResult } from '@/shared/types/pagination'

/* -------------------------------------------------------------------------- */
/*                              PAGINATED QUERY                               */
/* -------------------------------------------------------------------------- */

interface PaginateOptions<TResult> {
	data: (params: { limit: number; offset: number }) => Promise<TResult[]>
	pq: PaginationQuery
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

/** Convert `{ page, limit }` into SQL `{ limit, offset }`. */
export function toLimitOffset(pq: PaginationQuery): { limit: number; offset: number } {
	return { limit: pq.limit, offset: (pq.page - 1) * pq.limit }
}

/**
 * Two-query pagination: data + count in parallel.
 * Use when count differs from data query (joins, DISTINCT, grouped counts).
 *
 * @example
 * return paginate({
 *   data: ({ limit, offset }) => db.select().from(users).where(where).limit(limit).offset(offset),
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

export const WINDOW_COUNT_KEY = 'rowCount' as const

type WindowCountRow = { readonly [WINDOW_COUNT_KEY]?: string | number | null }

/**
 * Single-query pagination using `count(*) OVER()` window column.
 * Preferred for new modules — one round-trip instead of two.
 *
 * @example
 * const rows = await db
 *   .select({ ...getColumns(users), rowCount: sql<number>`count(*) over()` })
 *   .from(users).where(where).limit(limit).offset(offset)
 * return paginateWindow(rows, filter)
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
