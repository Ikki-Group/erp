import { useEffect, useMemo, useState } from 'react'

import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UseQueryOptions } from '@tanstack/react-query'

import type { AsyncComboboxOption } from '@/components/shared/async-combobox'

interface LookupDetail<TEntity> {
	success: true
	code: string
	data: TEntity
}

interface LookupPage<TEntity> extends Omit<LookupDetail<TEntity>, 'data'> {
	data: TEntity[]
	meta: { page: number; limit: number; total: number; totalPages: number }
}

/** Feature-owned adapters retain filters, resource keys, and DTO label mapping. */
export interface ResourceLookupAdapter<TEntity extends { id: number }> {
	listOptions: (query: {
		q?: string
		page: number
		limit: number
	}) => UseQueryOptions<LookupPage<TEntity>>
	detailOptions: (id: number) => UseQueryOptions<LookupDetail<TEntity>>
	label: (entity: TEntity) => string
}

const PAGE_SIZE = 25

/** Each loaded page and selected detail use the resource's existing Query cache. */
export function useResourceLookup<TEntity extends { id: number }>(
	adapter: ResourceLookupAdapter<TEntity>,
	selectedId: number | null,
	disabled = false,
) {
	const client = useQueryClient()
	const [search, setSearch] = useState({ query: '', pageCount: 1, adapter })
	const pageCount = search.adapter === adapter ? search.pageCount : 1
	const pages = useQueries({
		queries: Array.from({ length: pageCount }, (_, index) => ({
			...adapter.listOptions({ q: search.query || undefined, page: index + 1, limit: PAGE_SIZE }),
			enabled: !disabled,
			placeholderData: undefined,
			throwOnError: false,
		})),
	})
	const listedSelection = pages
		.map((page) => {
			const entity = page.data?.data.find((item) => item.id === selectedId)
			return entity && page.data
				? { success: page.data.success, code: page.data.code, data: entity }
				: undefined
		})
		.find((selection) => selection !== undefined)
	const detailOptions = adapter.detailOptions(selectedId ?? 0)
	const detail = useQuery({
		...detailOptions,
		enabled: selectedId !== null,
		placeholderData: undefined,
		initialData: listedSelection,
		// A list row gives an immediate label, but detail remains authoritative.
		initialDataUpdatedAt: 0,
		throwOnError: false,
	})
	useEffect(() => {
		if (!listedSelection || detail.data) return
		// The list may finish after detail fails. Retain its real label in the
		// canonical detail cache before retrying, rather than a separate ID cache.
		client.setQueryData(detailOptions.queryKey, listedSelection, { updatedAt: 0 })
		void detail.refetch()
	}, [client, detail.data, detail.refetch, detailOptions.queryKey, listedSelection])
	const selected = selectedId === null ? null : (detail.data?.data ?? listedSelection?.data ?? null)
	const selectedValue = selected ? String(selected.id) : null
	const selectedLabel = selected ? adapter.label(selected) : ''
	const selectedOption = useMemo(
		() => (selectedValue === null ? null : { value: selectedValue, label: selectedLabel }),
		[selectedValue, selectedLabel],
	)
	const entities = new Map<number, TEntity>()
	for (const page of pages) {
		for (const entity of page.data?.data ?? []) entities.set(entity.id, entity)
	}
	const options: AsyncComboboxOption[] = Array.from(entities.values(), (entity) => ({
		value: String(entity.id),
		label: adapter.label(entity),
	}))
	const firstPage = pages[0]!
	const lastPage = pages[pages.length - 1]!
	const failedPages = pages.filter((page) => page.isError)
	const isLoading = firstPage.isPending && !disabled
	const isLoadingMore = pages.length > 1 && lastPage.isFetching

	return {
		options,
		selectedOption,
		isLoading,
		isLoadingMore,
		hasMore: !!lastPage.data && lastPage.data.meta.page < lastPage.data.meta.totalPages,
		searchError: failedPages.length > 0,
		selectionError: selectedId !== null && detail.isError,
		isResolvingSelection: selectedId !== null && !selected && detail.isPending,
		isRetryingSelection: detail.isFetching,
		setSearch: (query: string) => {
			setSearch((current) =>
				current.query === query && current.adapter === adapter
					? current
					: { query, pageCount: 1, adapter },
			)
		},
		loadMore: () => {
			if (!lastPage.data || lastPage.isFetching || failedPages.length > 0) return
			if (lastPage.data.meta.page >= lastPage.data.meta.totalPages) return
			setSearch({ query: search.query, pageCount: pageCount + 1, adapter })
		},
		retrySearch: () => {
			for (const page of failedPages) void page.refetch()
		},
		retrySelection: () => void detail.refetch(),
		/** Reject a result that no longer belongs to the current server query. */
		select: (option: AsyncComboboxOption | null): TEntity | null | undefined => {
			if (option === null) return null
			const entity = entities.get(Number(option.value))
			if (!entity) return undefined
			const source = pages.find((page) =>
				page.data?.data.some((item) => item.id === entity.id),
			)?.data
			if (source) {
				client.setQueryData(adapter.detailOptions(entity.id).queryKey, {
					success: source.success,
					code: source.code,
					data: entity,
				})
			}
			return entity
		},
	}
}
