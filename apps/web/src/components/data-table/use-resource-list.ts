import type { ColumnDef, Table, TableFeatures } from '@tanstack/react-table'

import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'

import type { ListSearch } from './list-search'
import {
	deriveResourceListState,
	mergeResourceTableSearch,
	updateResourceFilters,
	type ResourceFilterPatch,
	type ResourceListQuery,
	type ResourceListState,
} from './resource-list-state'
import { useServerTable } from './use-server-table'

export interface ResourceListModel<TFeatures extends TableFeatures, TData extends object> {
	table: Table<TFeatures, TData>
	recordCount: number
	state: ResourceListState
	isRefreshing: boolean
	retry: () => void
}

interface UseResourceListOptions<TData extends object, TSearch extends ListSearch> {
	/** Use throwOnError: false so query failures reach this controller instead of a route boundary. */
	query: ResourceListQuery<TData>
	columns: ColumnDef<DataGridFeatures, TData>[]
	search: TSearch
	onSearchChange: (next: TSearch) => void
	/** Feature-owned predicate for extra filters; free-text search is included automatically. */
	hasFilters?: (search: TSearch) => boolean
}

/** URL-controlled resource table. DTO-to-query mapping and cache policy stay in the feature. */
export function useResourceList<TData extends object, TSearch extends ListSearch>({
	query,
	columns,
	search,
	onSearchChange,
	hasFilters,
}: UseResourceListOptions<TData, TSearch>) {
	const derived = deriveResourceListState(
		query,
		Boolean(search.q?.trim()) || (hasFilters?.(search) ?? false),
	)
	const { table, globalFilter } = useServerTable({
		data: derived.rows,
		columns,
		totalCount: derived.recordCount,
		search,
		onSearchChange: (next) => onSearchChange(mergeResourceTableSearch(search, next)),
	})

	return {
		table,
		recordCount: derived.recordCount,
		state: derived.state,
		isRefreshing: derived.isRefreshing,
		retry: () => {
			void query.refetch()
		},
		search,
		globalFilter,
		setFilters: (patch: ResourceFilterPatch<TSearch>) =>
			onSearchChange(updateResourceFilters(search, patch)),
	} satisfies ResourceListModel<DataGridFeatures, TData> & {
		search: TSearch
		globalFilter: string
		setFilters: (patch: ResourceFilterPatch<TSearch>) => void
	}
}
