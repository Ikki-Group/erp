export interface PaginationQuery {
  page: number
  limit: number
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface WithPaginationResult<T> {
  data: T[]
  meta: PaginationMeta
}

export function calculatePaginationMeta(pq: PaginationQuery, total: number): PaginationMeta {
  const { page, limit } = pq
  const totalPages = Math.ceil(total / limit)

  return {
    total,
    page,
    limit,
    totalPages,
  }
}

export function getLimitOffset(pq: PaginationQuery) {
  const page = Math.max(1, pq.page)
  const limit = Math.max(1, pq.limit)
  const offset = (page - 1) * limit

  return { limit, offset }
}
