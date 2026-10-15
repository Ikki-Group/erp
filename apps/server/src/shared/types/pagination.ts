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

// ─── Cursor (keyset) pagination ───

export interface CursorQuery {
	/** Opaque cursor from a previous page's `meta.nextCursor`; omitted for the first page. */
	cursor?: string | undefined
	limit: number
}

export interface CursorMeta {
	/** Cursor for the next page, or `null` on the last page. */
	nextCursor: string | null
	limit: number
}

export interface WithCursorResult<T> {
	data: T[]
	meta: CursorMeta
}
