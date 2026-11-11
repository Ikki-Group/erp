// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'

import type { ResourceListQuery } from './resource-list-state'
import { useResourceList } from './use-resource-list'

const columns = [{ accessorKey: 'id' as const, header: 'ID' }]
const rows = [{ id: 1 }]
const search = { page: 3, pageSize: 10, q: 'coffee', categoryId: 7, isActive: 0 }
const query: ResourceListQuery<{ id: number }> = {
	data: { data: rows, meta: { total: 30 } },
	isPending: false,
	isFetching: false,
	isError: false,
	refetch: () => undefined,
}

afterEach(cleanup)

it('keeps typed URL filters while actual table search and pagination actions reset or advance the page', () => {
	let next = search
	const { result } = renderHook(() =>
		useResourceList({
			query,
			columns,
			search,
			onSearchChange: (value) => {
				next = value
			},
			hasFilters: (value) => value.categoryId !== undefined || value.isActive !== undefined,
		}),
	)
	act(() => result.current.table.setGlobalFilter('tea'))
	expect(next).toEqual({ ...search, page: 1, q: 'tea', sort: undefined })
	act(() => result.current.table.setPageIndex(1))
	expect(next).toEqual({ ...search, page: 2, sort: undefined })
	act(() => result.current.table.setPageIndex(4))
	expect(next).toEqual({ ...search, page: 3, sort: undefined })
	act(() => result.current.setFilters({ categoryId: 12 }))
	expect(next).toEqual({ ...search, page: 1, categoryId: 12 })
})

it('keeps actual table rows on background refresh errors and delegates retry to the query', () => {
	let retries = 0
	const initial = {
		...query,
		refetch: () => {
			retries++
		},
	}
	const { result, rerender } = renderHook(
		({ current }) =>
			useResourceList({
				query: current,
				columns,
				search,
				onSearchChange: () => undefined,
			}),
		{ initialProps: { current: initial } },
	)
	const firstRows = result.current.table.getRowModel().rows
	expect(firstRows[0]?.original).toBe(rows[0])
	rerender({ current: { ...initial, isFetching: true } })
	expect(result.current.state).toBe('ready')
	expect(result.current.isRefreshing).toBe(true)
	rerender({ current: { ...initial, isError: true } })
	expect(result.current.state).toBe('refresh-error')
	expect(result.current.table.getRowModel().rows[0]?.original).toBe(rows[0])
	act(() => result.current.retry())
	expect(retries).toBe(1)
})
