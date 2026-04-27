import type { PaginationQuery } from '@/core/utils/pagination'

export type OmitPaginationQuery<T> = Omit<T, keyof PaginationQuery>
