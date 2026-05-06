import type { PaginationQuery } from '@/core/database/pagination'

export type OmitPaginationQuery<T> = Omit<T, keyof PaginationQuery>
