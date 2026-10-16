import type { ListSearch } from './list-search'

export interface ResourceListEnvelope<TData> {
	data: TData[]
	meta: { total: number }
}

export interface ResourceListQuery<TData> {
	data: ResourceListEnvelope<TData> | undefined
	isPending: boolean
	isFetching: boolean
	isError: boolean
	refetch: () => unknown
}

export type ResourceListState =
	| 'initial-loading'
	| 'initial-error'
	| 'refresh-error'
	| 'record-empty'
	| 'filtered-empty'
	| 'ready'

const EMPTY_ROWS: never[] = []

/** Query failure always wins over empty, and cached results survive refetches. */
export function deriveResourceListState<TData>(
	query: Omit<ResourceListQuery<TData>, 'refetch'>,
	hasFilters: boolean,
) {
	const data = query.data
	const rows = data?.data ?? EMPTY_ROWS
	let state: ResourceListState
	if (query.isError) state = data === undefined ? 'initial-error' : 'refresh-error'
	else if (data === undefined) state = 'initial-loading'
	else if (rows.length > 0) state = 'ready'
	else state = hasFilters || data.meta.total > 0 ? 'filtered-empty' : 'record-empty'

	return {
		rows,
		recordCount: data?.meta.total ?? 0,
		state,
		isRefreshing: data !== undefined && query.isFetching,
	}
}

/** A table only owns its standard fields; route-specific filters remain untouched. */
export function mergeResourceTableSearch<TSearch extends ListSearch>(
	current: TSearch,
	next: ListSearch,
): TSearch {
	return { ...current, page: next.page, pageSize: next.pageSize, q: next.q, sort: next.sort }
}

export type ResourceFilterPatch<TSearch extends ListSearch> = Partial<
	Omit<TSearch, 'page' | 'pageSize' | 'sort'>
>

export function updateResourceFilters<TSearch extends ListSearch>(
	current: TSearch,
	patch: ResourceFilterPatch<TSearch>,
): TSearch {
	return { ...current, ...patch, page: 1 }
}
