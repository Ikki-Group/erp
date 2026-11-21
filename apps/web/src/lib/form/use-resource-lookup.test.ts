// @vitest-environment jsdom

import { createElement } from 'react'
import type { ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { useResourceLookup } from './use-resource-lookup.ts'
import type { ResourceLookupAdapter } from './use-resource-lookup.ts'

interface Entity {
	id: number
	name: string
}

const records: Entity[] = Array.from({ length: 125 }, (_, index) => ({
	id: index + 1,
	name: `Record ${index + 1}`,
}))

function setup() {
	const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
	const state = { listFails: false, detailFails: false }
	const adapter: ResourceLookupAdapter<Entity> = {
		listOptions: (query) => ({
			queryKey: ['lookup', 'list', query],
			queryFn: async () => {
				if (state.listFails) throw new Error('Search unavailable')
				const filtered = records.filter((record) => !query.q || record.name.includes(query.q))
				return {
					success: true,
					code: 'OK',
					data: filtered.slice((query.page - 1) * query.limit, query.page * query.limit),
					meta: {
						page: query.page,
						limit: query.limit,
						total: filtered.length,
						totalPages: Math.ceil(filtered.length / query.limit),
					},
				}
			},
		}),
		detailOptions: (id) => ({
			queryKey: ['lookup', 'detail', { id }],
			queryFn: async () => {
				if (state.detailFails) throw new Error('Detail unavailable')
				const entity = records.find((record) => record.id === id)
				if (!entity) throw new Error('Record not found')
				return { success: true, code: 'OK', data: entity }
			},
		}),
		label: (entity) => entity.name,
	}
	const wrapper = ({ children }: { children: ReactNode }) =>
		createElement(QueryClientProvider, { client }, children)
	return { adapter, client, state, wrapper }
}

afterEach(cleanup)

describe('resource lookup', () => {
	it('names an existing selection outside the current page and preserves it when refetch fails', async () => {
		const { adapter, client, state, wrapper } = setup()
		const { result } = renderHook(() => useResourceLookup(adapter, 125), { wrapper })

		await waitFor(() => expect(result.current.selectedOption?.label).toBe('Record 125'))
		expect(result.current.options.some((option) => option.value === '125')).toBe(false)

		state.detailFails = true
		await act(() => client.invalidateQueries({ queryKey: ['lookup', 'detail'] }))
		await waitFor(() => expect(result.current.selectionError).toBe(true))
		expect(result.current.selectedOption).toEqual({ label: 'Record 125', value: '125' })

		state.detailFails = false
		act(() => result.current.retrySelection())
		await waitFor(() => expect(result.current.selectionError).toBe(false))
		expect(result.current.selectedOption?.label).toBe('Record 125')
	})

	it('keeps an unresolved ID distinct from empty selection and recovers its name on retry', async () => {
		const { adapter, state, wrapper } = setup()
		state.detailFails = true
		const { result } = renderHook(() => useResourceLookup(adapter, 125), { wrapper })

		await waitFor(() => expect(result.current.selectionError).toBe(true))
		expect(result.current.selectedOption).toBeNull()
		state.detailFails = false
		act(() => result.current.retrySelection())
		await waitFor(() => expect(result.current.selectedOption?.label).toBe('Record 125'))
	})

	it('retains a list-resolved label across search changes when detail remains unavailable', async () => {
		const { adapter, state, wrapper } = setup()
		state.detailFails = true
		const { result } = renderHook(() => useResourceLookup(adapter, 7), { wrapper })
		await waitFor(() => expect(result.current.selectedOption?.label).toBe('Record 7'))
		await waitFor(() => expect(result.current.selectionError).toBe(true))
		const selectedOption = result.current.selectedOption

		act(() => result.current.setSearch('Record 125'))
		await waitFor(() => expect(result.current.options).toHaveLength(1))
		expect(result.current.selectedOption).toBe(selectedOption)
		expect(result.current.selectionError).toBe(true)
	})

	it('reaches records after the first hundred and resets pagination for server search', async () => {
		const { adapter, wrapper } = setup()
		const { result } = renderHook(() => useResourceLookup(adapter, null), { wrapper })
		await waitFor(() => expect(result.current.options).toHaveLength(25))

		for (let page = 2; page <= 5; page += 1) {
			act(() => result.current.loadMore())
			await waitFor(() => expect(result.current.options).toHaveLength(page * 25))
		}
		expect(result.current.hasMore).toBe(false)
		expect(result.current.options[124]?.value).toBe('125')

		act(() => result.current.setSearch('Record 125'))
		await waitFor(() =>
			expect(result.current.options).toEqual([{ label: 'Record 125', value: '125' }]),
		)
		expect(result.current.hasMore).toBe(false)
		expect(result.current.select({ label: 'Record 1', value: '1' })).toBeUndefined()
	})

	it('distinguishes list failures from empty results and retries the failed page', async () => {
		const { adapter, state, wrapper } = setup()
		state.listFails = true
		const { result } = renderHook(() => useResourceLookup(adapter, null), { wrapper })
		await waitFor(() => expect(result.current.searchError).toBe(true))
		expect(result.current.isLoading).toBe(false)

		state.listFails = false
		act(() => result.current.retrySearch())
		await waitFor(() => expect(result.current.options).toHaveLength(25))
		expect(result.current.searchError).toBe(false)

		state.listFails = true
		act(() => result.current.loadMore())
		await waitFor(() => expect(result.current.searchError).toBe(true))
		expect(result.current.options).toHaveLength(25)
		state.listFails = false
		act(() => result.current.retrySearch())
		await waitFor(() => expect(result.current.options).toHaveLength(50))

		act(() => result.current.setSearch('no matching record'))
		await waitFor(() => expect(result.current.isLoading).toBe(false))
		expect(result.current.searchError).toBe(false)
		expect(result.current.options).toEqual([])
	})

	it('seeds the canonical detail cache on selection and clearing remains null', async () => {
		const { adapter, client, state, wrapper } = setup()
		const { result, rerender } = renderHook(({ id }) => useResourceLookup(adapter, id), {
			initialProps: { id: null as number | null },
			wrapper,
		})
		await waitFor(() => expect(result.current.options).toHaveLength(25))
		let selected: Entity | null | undefined
		act(() => {
			selected = result.current.select({ label: 'Record 7', value: '7' })
		})
		expect(selected).toEqual(records[6])
		expect(client.getQueryData(['lookup', 'detail', { id: 7 }])).toEqual({
			success: true,
			code: 'OK',
			data: records[6],
		})
		state.detailFails = true
		rerender({ id: 7 })
		expect(result.current.selectedOption?.label).toBe('Record 7')
		act(() => result.current.setSearch('Record 125'))
		await waitFor(() => expect(result.current.options).toHaveLength(1))
		expect(result.current.selectedOption?.label).toBe('Record 7')
		expect(result.current.select(null)).toBeNull()
		rerender({ id: null })
		expect(result.current.selectedOption).toBeNull()
		expect(result.current.selectionError).toBe(false)
	})
})
