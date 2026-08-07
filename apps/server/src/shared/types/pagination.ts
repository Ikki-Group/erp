export interface PaginationQuery {
	page: number
	limit: number
}

export interface PaginationMeta {
	page: number
	limit: number
	total: number
	totalPages: number
}

export interface WithPaginationResult<T> {
	data: T[]
	meta: PaginationMeta
}
