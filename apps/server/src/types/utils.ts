import type { PaginationQuery } from '@/lib/utils/pagination'

export type OmitPaginationQuery<T> = Omit<T, keyof PaginationQuery>
