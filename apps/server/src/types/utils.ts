import type { PaginationQuery } from '@/core/database/pagination'

export type OmitPaginationQuery<T> = Omit<T, keyof PaginationQuery>

export type PrimitiveId = number | string

export type EntityRef<V extends PrimitiveId = number> = {
	id: V
}

export type WithId<T, V extends PrimitiveId = number> = T & EntityRef<V>

export type ActorId = number
