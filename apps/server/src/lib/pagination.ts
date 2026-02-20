import type { PgSelect } from 'drizzle-orm/pg-core'
import z from 'zod'

export const PaginationQuery = z.object({
  page: z.coerce.number<number>().min(1).default(1),
  limit: z.coerce.number<number>().min(1).max(100).default(10),
})

export type PaginationQuery = z.infer<typeof PaginationQuery>

export const PaginationMeta = z.object({
  total: z.number().min(0),
  page: z.number().min(1),
  limit: z.number().min(1),
  totalPages: z.number().min(1),
})

export type PaginationMeta = z.infer<typeof PaginationMeta>

export interface WithPaginationResult<T> {
  data: T[]
  meta: PaginationMeta
}

export function calculatePaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit)

  return {
    total,
    page,
    limit,
    totalPages,
  }
}

export function withPagination<T extends PgSelect>(qb: T, pq: PaginationQuery) {
  const page = Math.max(1, pq.page)
  const limit = Math.max(1, pq.limit)
  const offset = (page - 1) * limit

  return qb.limit(limit).offset(offset)
}
